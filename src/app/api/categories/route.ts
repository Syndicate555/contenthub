import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ITEM_CATEGORIES, type ItemCategory } from "@/types";

// GET /api/categories - Get category counts with thumbnails
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all non-deleted items for the user
    const items = await db.item.findMany({
      where: {
        userId: user.id,
        status: { not: "deleted" },
      },
      select: {
        id: true,
        category: true,
        imageUrl: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group items by category and collect thumbnails
    const categoryMap = new Map<string, { count: number; thumbnails: string[]; titles: string[] }>();

    // Initialize with all categories
    ITEM_CATEGORIES.forEach((cat) => {
      categoryMap.set(cat.value, { count: 0, thumbnails: [], titles: [] });
    });

    // Count items per category and collect thumbnails
    items.forEach((item) => {
      const category = item.category || "other";
      const data = categoryMap.get(category) || { count: 0, thumbnails: [], titles: [] };
      data.count += 1;

      // Collect up to 4 thumbnails per category (for the preview grid)
      if (data.thumbnails.length < 4 && item.imageUrl) {
        data.thumbnails.push(item.imageUrl);
      }

      // Collect titles as fallback for items without images
      if (data.titles.length < 4) {
        data.titles.push(item.title || "Untitled");
      }

      categoryMap.set(category, data);
    });

    // Build response with category metadata
    const categories = ITEM_CATEGORIES.map((cat) => {
      const data = categoryMap.get(cat.value) || { count: 0, thumbnails: [], titles: [] };
      return {
        category: cat.value as ItemCategory,
        label: cat.label,
        icon: cat.icon,
        count: data.count,
        thumbnails: data.thumbnails,
        titles: data.titles,
      };
    }).filter((cat) => cat.count > 0); // Only return categories with items

    // Calculate total items
    const totalItems = items.length;

    // Get unique platforms
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

    return NextResponse.json({
      ok: true,
      data: {
        categories,
        totalItems,
        platforms: platformCounts,
      },
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
