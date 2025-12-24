import { NextRequest, NextResponse } from "next/server";

// Ensure Node.js runtime (jsdom/parse5 are not edge-compatible)
export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { createItemSchema, itemsQuerySchema } from "@/lib/schemas";
import type { Prisma } from "@/generated/prisma";
import { getPlatformDomains, normalizePlatformSlug } from "@/lib/platforms";
import { normalizeDomain } from "@/lib/platform-normalizer";

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
      tag:
        searchParams.getAll("tag").length > 0
          ? searchParams.getAll("tag")
          : searchParams.get("tag") || undefined,
      category:
        searchParams.getAll("category").length > 0
          ? searchParams.getAll("category")
          : searchParams.get("category") || undefined,
      platform:
        searchParams.getAll("platform").length > 0
          ? searchParams.getAll("platform")
          : searchParams.get("platform") || undefined,
      author:
        searchParams.getAll("author").length > 0
          ? searchParams.getAll("author")
          : searchParams.get("author") || undefined,
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

    const toArray = <T>(val: T | T[] | undefined): T[] =>
      val === undefined ? [] : Array.isArray(val) ? val : [val];

    // Status filter
    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    // Tag filter (multi-select, using ItemTag relation)
    const tags = toArray(query.tag);
    if (tags.length) {
      where.itemTags = {
        some: {
          tag: {
            displayName: { in: tags },
          },
        },
      };
    }

    // Category filter (multi-select)
    const categories = toArray(query.category);
    if (categories.length) {
      where.category = { in: categories as any };
    }

    // Author filter (multi-select)
    const authors = toArray(query.author);
    if (authors.length) {
      where.author = { in: authors };
    }

    // Platform filter (normalized domain-based filtering)
    const platformInputs = toArray(query.platform);
    if (platformInputs.length) {
      const platformFilters: Prisma.ItemWhereInput[] = [];

      for (const platformInput of platformInputs) {
        const platformSlug = normalizePlatformSlug(platformInput);

        if (platformSlug) {
          const domains = getPlatformDomains(platformSlug);

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
        } else {
          // For non-standard platforms, match by normalized domain
          const allSources = await db.item.findMany({
            where: {
              userId: user.id,
              status: { not: "deleted" },
              source: { not: null },
            },
            select: { source: true },
            distinct: ["source"],
          });

          const matchingSources = allSources
            .filter(
              (item) => normalizeDomain(item.source || "") === platformInput,
            )
            .map((item) => item.source!);

          if (matchingSources.length > 0) {
            platformFilters.push({
              source: { in: matchingSources },
            });
          }
        }
      }

      if (platformFilters.length) {
        appendAndFilters(platformFilters);
      }
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
          author: true,
          imageUrl: true,
          videoUrl: true,
          documentUrl: true,
          embedHtml: true,
          category: true,
          type: true,
          tags: true, // Keep for backward compatibility during migration
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
          itemTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
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
      tags: item.itemTags.map((it) => it.tag.displayName), // Flatten tags from new relation
      itemTags: undefined, // Remove from response
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
      {
        ok: false,
        error: "Failed to fetch items",
      },
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

    // Prevent writes in demo mode
    try {
      const { assertNotDemoUser } = await import("@/lib/auth");
      await assertNotDemoUser(user);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Demo mode is read-only. Sign in to save changes.",
        },
        { status: 403 },
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
      preExtractedData: body.preExtractedData,
    });

    return NextResponse.json(
      { ok: true, data: result.item, newBadges: result.newBadges },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/items error:", error);

    // Return user-friendly error message from pipeline validation
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process this URL. Please check the URL and try again.";

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 400 }, // Use 400 for validation errors, not 500
    );
  }
}
