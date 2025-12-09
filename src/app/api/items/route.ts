import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { createItemSchema, itemsQuerySchema } from "@/lib/schemas";
import type { Prisma } from "@/generated/prisma";
import { getPlatformDomains, normalizePlatformSlug } from "@/lib/platforms";

// GET /api/items - List items with search and filters
export async function GET(request: NextRequest) {
  try {
    // Get or create user (handles first-time sign-in)
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = itemsQuerySchema.parse({
      q: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      tag: searchParams.get("tag") || undefined,
      category: searchParams.get("category") || undefined,
      platform: searchParams.get("platform") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    // Build where clause
    const where: Prisma.ItemWhereInput = {
      userId: user.id,
      status: { not: "deleted" }, // Don't show deleted items by default
    };

    // Helper to append AND filters while normalizing Prisma's union type (object | array)
    const appendAndFilters = (filters: Prisma.ItemWhereInput[]) => {
      if (filters.length === 0) return;
      const existing = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];
      where.AND = [...existing, ...filters];
    };

    // Status filter
    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    // Tag filter
    if (query.tag) {
      where.tags = { has: query.tag };
    }

    // Category filter
    if (query.category) {
      where.category = query.category;
    }

    // Platform filter (normalized domain-based filtering)
    const platformSlug = normalizePlatformSlug(query.platform);
    if (platformSlug) {
      const platformFilters: Prisma.ItemWhereInput[] = [];
      const domains = getPlatformDomains(platformSlug);

      // Newsletter: include email import source
      if (platformSlug === "newsletter") {
        platformFilters.push({ importSource: "email" });
      }

      if (domains.length > 0) {
        platformFilters.push({
          OR: domains.map((domain) => ({
            source: { contains: domain, mode: "insensitive" },
          })),
        });
      }

      appendAndFilters(platformFilters);
    } else if (query.platform) {
      // Fallback: substring match if unknown slug
      appendAndFilters([
        { source: { contains: query.platform, mode: "insensitive" } },
      ]);
    }

    // Search query
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { summary: { contains: query.q, mode: "insensitive" } },
        { note: { contains: query.q, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Fetch count and items in parallel for better performance
    const [total, items] = await Promise.all([
      db.item.count({ where }),
      db.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
        // Select fields needed for list view (optimized payload)
        select: {
          id: true,
          url: true,
          title: true,
          summary: true,
          imageUrl: true,
          category: true,
          type: true,
          tags: true,
          note: true,
          source: true,
          status: true,
          domainId: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          domain: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
              color: true,
            },
          },
        },
      }),
    ]);

    // Fetch XP events and focus areas in parallel
    const itemIds = items.map((item) => item.id);
    const [xpEvents, focusAreas] = await Promise.all([
      itemIds.length > 0
        ? db.xPEvent.findMany({
            where: {
              userId: user.id,
              itemId: { in: itemIds },
            },
            select: {
              itemId: true,
              action: true,
              xpAmount: true,
            },
          })
        : Promise.resolve([]),
      db.focusArea.findMany({
        where: { userId: user.id },
        select: { domainId: true, priority: true },
      }),
    ]);

    // Group XP by item
    const xpByItem = xpEvents.reduce(
      (acc, event) => {
        if (!event.itemId) return acc;
        if (!acc[event.itemId]) {
          acc[event.itemId] = { total: 0, breakdown: {} };
        }
        acc[event.itemId].total += event.xpAmount;
        acc[event.itemId].breakdown[event.action] =
          (acc[event.itemId].breakdown[event.action] || 0) + event.xpAmount;
        return acc;
      },
      {} as Record<
        string,
        { total: number; breakdown: Record<string, number> }
      >,
    );

    const focusAreaDomainIds = new Set(focusAreas.map((fa) => fa.domainId));

    // Enrich items with gamification data
    const enrichedItems = items.map((item) => ({
      ...item,
      xpEarned: xpByItem[item.id]?.total || 0,
      xpBreakdown: xpByItem[item.id]?.breakdown || {},
      isInFocusArea: item.domainId
        ? focusAreaDomainIds.has(item.domainId)
        : false,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / query.limit);
    const hasMore = query.page < totalPages;

    // Create response with cache headers
    const response = NextResponse.json({
      ok: true,
      data: enrichedItems,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasMore,
      },
    });

    // Add cache headers for browser caching (stale-while-revalidate pattern)
    // For user-specific data, avoid any shared browser caching
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}

// POST /api/items - Create and process a new item
export async function POST(request: NextRequest) {
  try {
    // Get or create user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Process the item
    const result = await processItem({
      url: parsed.data.url,
      note: parsed.data.note,
      userId: user.id,
    });

    return NextResponse.json(
      { ok: true, data: result.item, newBadges: result.newBadges },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create item" },
      { status: 500 },
    );
  }
}
