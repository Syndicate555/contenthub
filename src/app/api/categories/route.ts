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

    // OPTIMIZATION: Fetch all thumbnails in ONE query to eliminate N+1 pattern
    // Get the most recent items per category (up to 100 total)
    const allThumbnailItems = await db.item.findMany({
      where: {
        userId: user.id,
        status: { not: "deleted" },
      },
      select: {
        category: true,
        imageUrl: true,
        title: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Fetch top 100 most recent items (will have 4+ per category)
    });

    // Group items by category in memory and take first 4 per category
    const thumbnailMap = new Map<string, { thumbnails: string[]; titles: string[] }>();

    for (const item of allThumbnailItems) {
      const cat = item.category || "other";

      if (!thumbnailMap.has(cat)) {
        thumbnailMap.set(cat, { thumbnails: [], titles: [] });
      }

      const catData = thumbnailMap.get(cat)!;

      // Only store up to 4 items per category
      if (catData.titles.length < 4) {
        catData.titles.push(item.title || "Untitled");
        if (item.imageUrl) {
          catData.thumbnails.push(item.imageUrl);
        }
      }
    }

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
    // User-specific view; do not allow browser caching across sessions
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
