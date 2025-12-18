import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";

const tagsQuerySchema = z.object({
  q: z.string().optional(), // Search query
  limit: z.coerce.number().min(1).max(500).default(100),
  sortBy: z.enum(["usage", "alphabetical", "recent"]).default("usage"),
});

/**
 * GET /api/tags
 * List all tags with usage counts
 *
 * Query params:
 * - q: Search query (filters by tag name)
 * - limit: Max tags to return (default: 100, max: 500)
 * - sortBy: Sort order (usage|alphabetical|recent, default: usage)
 *
 * @example
 * GET /api/tags?sortBy=usage&limit=50
 * GET /api/tags?q=machine&sortBy=alphabetical
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = tagsQuerySchema.parse({
      q: searchParams.get("q") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
    });

    // Build where clause
    const where: Prisma.TagWhereInput = {
      usageCount: { gt: 0 }, // Only show tags that are used
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { displayName: { contains: query.q, mode: "insensitive" } },
      ];
    }

    // Determine sort order
    let orderBy: Prisma.TagOrderByWithRelationInput;
    switch (query.sortBy) {
      case "alphabetical":
        orderBy = { displayName: "asc" };
        break;
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      case "usage":
      default:
        orderBy = { usageCount: "desc" };
        break;
    }

    // Fetch tags with dynamic per-user usage counts
    // Step 1: Get actual usage counts for this user
    const userTagCounts = await db.itemTag.groupBy({
      by: ["tagId"],
      where: {
        item: {
          userId: user.id,
          status: { not: "deleted" },
        },
      },
      _count: {
        tagId: true,
      },
    });

    const countMap = new Map(
      userTagCounts.map((item) => [item.tagId, item._count.tagId]),
    );

    // Step 2: Get tags that match the where clause
    const allTags = await db.tag.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        createdAt: true,
      },
    });

    // Step 3: Enrich tags with per-user usage counts
    const enrichedTags = allTags
      .map((tag) => ({
        id: tag.id,
        displayName: tag.displayName,
        usageCount: countMap.get(tag.id) || 0,
        createdAt: tag.createdAt,
      }))
      .filter((tag) => tag.usageCount > 0); // Only show tags used by this user

    // Step 4: Sort based on query
    let sortedTags = enrichedTags;
    switch (query.sortBy) {
      case "alphabetical":
        sortedTags = enrichedTags.sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        );
        break;
      case "recent":
        sortedTags = enrichedTags.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        break;
      case "usage":
      default:
        sortedTags = enrichedTags.sort((a, b) => b.usageCount - a.usageCount);
        break;
    }

    // Step 5: Apply limit
    const tags = sortedTags.slice(0, query.limit);

    return NextResponse.json({
      ok: true,
      data: tags,
      meta: {
        total: tags.length,
        sortBy: query.sortBy,
      },
    });
  } catch (error) {
    console.error("GET /api/tags error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Failed to fetch tags" },
      { status: 500 },
    );
  }
}
