import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStats, getUserDomainStats, getRecentXPEvents } from "@/lib/xp";
import { getUserBadges, getAllBadges } from "@/lib/badges";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/profile
 * Batch endpoint that returns all data needed for the Profile page in one request
 * Combines: user stats, domain stats, recent XP events, and badges
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Fetch all profile data in parallel for maximum performance
    const [stats, domainStats, recentEvents, earnedBadges, allBadges] = await Promise.all([
      getUserStats(user.id),
      getUserDomainStats(user.id),
      getRecentXPEvents(user.id, 10),
      getUserBadges(user.id),
      getAllBadges(),
    ]);

    // Map earned badges for quick lookup
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));

    // Combine data: mark which badges are earned
    const badgesWithProgress = allBadges.map((badge) => {
      const earned = earnedBadges.find((eb) => eb.id === badge.id);

      return {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        domain: badge.domain,
        earned: !!earned,
        awardedAt: earned?.awardedAt || null,
      };
    });

    // Group badges by rarity for easier display
    const badgesByRarity = {
      common: badgesWithProgress.filter((b) => b.rarity === "common"),
      rare: badgesWithProgress.filter((b) => b.rarity === "rare"),
      epic: badgesWithProgress.filter((b) => b.rarity === "epic"),
      legendary: badgesWithProgress.filter((b) => b.rarity === "legendary"),
    };

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
          // Badges
          earnedBadges,
          allBadges: badgesWithProgress,
          badgesByRarity,
          badgeStats: {
            total: allBadges.length,
            earned: earnedBadges.length,
            progress: Math.round((earnedBadges.length / allBadges.length) * 100),
          },
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/dashboard/profile error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}
