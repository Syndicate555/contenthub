import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStats, getUserDomainStats, getRecentXPEvents } from "@/lib/xp";

// GET /api/user/stats - Get user's gamification stats
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Fetch all stats in parallel
    const [stats, domainStats, recentEvents] = await Promise.all([
      getUserStats(user.id),
      getUserDomainStats(user.id),
      getRecentXPEvents(user.id, 10),
    ]);

    return NextResponse.json(
      {
        ok: true,
        data: {
          // Overall stats
          stats: {
            totalXp: stats.totalXp,
            level: stats.overallLevel,
            levelProgress: stats.levelProgress,
            itemsSaved: stats.itemsSaved,
            itemsProcessed: stats.itemsProcessed,
            reflections: stats.reflections,
            questsCompleted: stats.questsCompleted,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            lastActivityAt: stats.lastActivityAt,
          },
          // Domain-specific stats
          domains: domainStats.map((d) => ({
            id: d.domain.id,
            name: d.domain.name,
            displayName: d.domain.displayName,
            icon: d.domain.icon,
            color: d.domain.color,
            totalXp: d.totalXp,
            level: d.level,
            levelProgress: d.levelProgress,
            itemCount: d.itemCount,
          })),
          // Recent XP events
          recentActivity: recentEvents.map((e) => ({
            id: e.id,
            action: e.action,
            xpAmount: e.xpAmount,
            domain: e.domain
              ? {
                  name: e.domain.name,
                  displayName: e.domain.displayName,
                  icon: e.domain.icon,
                  color: e.domain.color,
                }
              : null,
            createdAt: e.createdAt,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/user/stats error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch user stats" },
      { status: 500 },
    );
  }
}
