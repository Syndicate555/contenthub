import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { createItemSchema, itemsQuerySchema } from "@/lib/schemas";
import type { Prisma } from "@/generated/prisma";

// GET /api/items - List items with search and filters
export async function GET(request: NextRequest) {
  try {
    // Get or create user (handles first-time sign-in)
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

    // Platform filter (source contains the platform domain)
    if (query.platform) {
      where.source = { contains: query.platform, mode: "insensitive" };
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

    // Get total count for pagination
    const total = await db.item.count({ where });

    const items = await db.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / query.limit);
    const hasMore = query.page < totalPages;

    return NextResponse.json({
      ok: true,
      data: items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/items - Create and process a new item
export async function POST(request: NextRequest) {
  try {
    // Get or create user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Process the item
    const result = await processItem({
      url: parsed.data.url,
      note: parsed.data.note,
      userId: user.id,
    });

    return NextResponse.json(
      { ok: true, data: result.item },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
}
