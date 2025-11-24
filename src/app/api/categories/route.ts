import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ITEM_CATEGORIES, type ItemCategory } from "@/types";

// GET /api/categories - Get category counts with thumbnails (OPTIMIZED)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // OPTIMIZATION: Use groupBy for counts instead of fetching all items
    const categoryCounts = await db.item.groupBy({
      by: ["category"],
      where: {
        userId: user.id,
        status: { not: "deleted" },
      },
      _count: { id: true },
    });

    // Create a map of category -> count
    const countMap = new Map<string, number>();
    let totalItems = 0;
    categoryCounts.forEach((c) => {
      const cat = c.category || "other";
      countMap.set(cat, c._count.id);
      totalItems += c._count.id;
    });

    // OPTIMIZATION: Only fetch thumbnails for categories that have items
    // Fetch only 4 items per category for thumbnails (much more efficient)
    const categoriesWithItems = Array.from(countMap.keys());

    // Parallel fetch thumbnails for each category (limited to 4 per category)
    const thumbnailPromises = categoriesWithItems.map(async (category) => {
      const items = await db.item.findMany({
        where: {
          userId: user.id,
          status: { not: "deleted" },
          category: category === "other" ? null : category,
        },
        select: {
          imageUrl: true,
          title: true,
        },
        orderBy: { createdAt: "desc" },
        take: 4, // Only get 4 items for thumbnails
      });

      return {
        category,
        thumbnails: items.filter((i) => i.imageUrl).map((i) => i.imageUrl!),
        titles: items.map((i) => i.title || "Untitled"),
      };
    });

    const thumbnailResults = await Promise.all(thumbnailPromises);
    const thumbnailMap = new Map(
      thumbnailResults.map((r) => [r.category, { thumbnails: r.thumbnails, titles: r.titles }])
    );

    // Build response with category metadata
    const categories = ITEM_CATEGORIES.map((cat) => {
      const count = countMap.get(cat.value) || 0;
      const thumbnailData = thumbnailMap.get(cat.value) || { thumbnails: [], titles: [] };

      return {
        category: cat.value as ItemCategory,
        label: cat.label,
        icon: cat.icon,
        count,
        thumbnails: thumbnailData.thumbnails,
        titles: thumbnailData.titles,
      };
    }).filter((cat) => cat.count > 0); // Only return categories with items

    // Get unique platforms (this query is already efficient)
    const platforms = await db.item.groupBy({
      by: ["source"],
      where: {
        userId: user.id,
        status: { not: "deleted" },
        source: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const platformCounts = platforms.map((p) => ({
      platform: p.source || "unknown",
      count: p._count.id,
    }));

    // Create response with cache headers
    const response = NextResponse.json({
      ok: true,
      data: {
        categories,
        totalItems,
        platforms: platformCounts,
      },
    });

    // Add cache headers for browser caching (stale-while-revalidate pattern)
    // Cache for 30 seconds, allow stale for 60 seconds while revalidating
    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
