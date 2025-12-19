import { ProfilePageClient } from "./ProfilePageClient";
import { SWRConfig } from "swr";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getUserStats, getUserDomainStats, getRecentXPEvents } from "@/lib/xp";
import { getUserBadges, getAllBadges } from "@/lib/badges";

export const metadata = {
  title: "Profile | Tavlo",
  description: "View your learning progress and achievements",
};

// Force dynamic rendering because we depend on auth headers during build
export const dynamic = "force-dynamic";

async function getProfileData() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return null;

    // Fetch all profile data in parallel (same as API route)
    const [stats, domainStats, recentEvents, earnedBadges, allBadges] =
      await Promise.all([
        getUserStats(user.id),
        getUserDomainStats(user.id),
        getRecentXPEvents(user.id, 10),
        getUserBadges(user.id),
        getAllBadges(),
      ]);

    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));
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

    const badgesByRarity = {
      common: badgesWithProgress.filter((b) => b.rarity === "common"),
      rare: badgesWithProgress.filter((b) => b.rarity === "rare"),
      epic: badgesWithProgress.filter((b) => b.rarity === "epic"),
      legendary: badgesWithProgress.filter((b) => b.rarity === "legendary"),
    };

    return {
      ok: true,
      data: {
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
        earnedBadges,
        allBadges: badgesWithProgress,
        badgesByRarity,
        badgeStats: {
          total: allBadges.length,
          earned: earnedBadges.length,
          progress: Math.round((earnedBadges.length / allBadges.length) * 100),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return null;
  }
}

export default async function ProfilePage() {
  // Fetch data on server for instant display (no loading state)
  const profileData = await getProfileData();

  return (
    <SWRConfig
      value={{
        fallback: profileData
          ? {
              "/api/dashboard/profile": profileData,
            }
          : {},
      }}
    >
      <ProfilePageClient />
    </SWRConfig>
  );
}
