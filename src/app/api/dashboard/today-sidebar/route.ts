import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStats } from "@/lib/xp";
import { db } from "@/lib/db";
import {
  PLATFORM_CONFIG,
  getPlatformSlugFromSource,
  PlatformSlug,
} from "@/lib/platforms";

/**
 * Map source domains to friendly display names and icons
 */
const PLATFORM_ORDER = [...PLATFORM_CONFIG].sort((a, b) => a.order - b.order);

/**
 * GET /api/dashboard/today-sidebar
 * Returns user profile summary and content source statistics for the today page sidebar
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Fetch stats and source breakdown in parallel
    const [stats, sourceStats] = await Promise.all([
      getUserStats(user.id),
      db.item.groupBy({
        by: ["source"],
        where: {
          userId: user.id,
          status: "new",
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
    ]);

    // Aggregate counts by normalized platform slug
    const platformCount = new Map<PlatformSlug, number>();

    for (const stat of sourceStats) {
      const slug = getPlatformSlugFromSource(stat.source);
      platformCount.set(slug, (platformCount.get(slug) || 0) + stat._count.id);
    }

    const sources = PLATFORM_ORDER.filter((p) => p.slug !== "other").map(
      (platform) => ({
        source: platform.slug,
        displayName: platform.label,
        icon: platform.icon,
        count: platformCount.get(platform.slug) || 0,
      }),
    );

    // Optionally include "Other" if there are unclassified sources
    const otherCount = platformCount.get("other") || 0;
    if (otherCount > 0) {
      sources.push({
        source: "other",
        displayName: "Other",
        icon: "🌐",
        count: otherCount,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          stats: {
            totalXp: stats.totalXp,
            level: stats.overallLevel,
            levelProgress: stats.levelProgress,
            itemsSaved: stats.itemsSaved,
            itemsProcessed: stats.itemsProcessed,
            currentStreak: stats.currentStreak,
          },
          sources,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/dashboard/today-sidebar error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch sidebar data" },
      { status: 500 },
    );
  }
}
