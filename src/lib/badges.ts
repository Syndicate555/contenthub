// Badge System Service
// Defines badge criteria and handles badge checking/awarding

import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/cache";

/**
 * Badge criteria types
 */
export const BADGE_CRITERIA = {
  ITEM_COUNT: "item_count",         // Total items saved
  STREAK: "streak",                 // Consecutive days streak
  DOMAIN_LEVEL: "domain_level",     // Reach level X in a domain
  XP_TOTAL: "xp_total",            // Total XP earned
  SPECIAL: "special",               // Custom special criteria
} as const;

/**
 * Badge rarity levels
 */
export const BADGE_RARITY = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
} as const;

/**
 * Default badge definitions
 * These will be seeded into the database
 */
export const DEFAULT_BADGES = [
  // Item count badges
  {
    key: "first_item",
    name: "First Steps",
    description: "Save your first item",
    icon: "🌱",
    rarity: BADGE_RARITY.COMMON,
    criteriaType: BADGE_CRITERIA.ITEM_COUNT,
    criteriaValue: 1,
  },
  {
    key: "items_10",
    name: "Collector",
    description: "Save 10 items",
    icon: "📚",
    rarity: BADGE_RARITY.COMMON,
    criteriaType: BADGE_CRITERIA.ITEM_COUNT,
    criteriaValue: 10,
  },
  {
    key: "items_50",
    name: "Knowledge Seeker",
    description: "Save 50 items",
    icon: "🔍",
    rarity: BADGE_RARITY.RARE,
    criteriaType: BADGE_CRITERIA.ITEM_COUNT,
    criteriaValue: 50,
  },
  {
    key: "items_100",
    name: "Curator",
    description: "Save 100 items",
    icon: "🏛️",
    rarity: BADGE_RARITY.EPIC,
    criteriaType: BADGE_CRITERIA.ITEM_COUNT,
    criteriaValue: 100,
  },

  // Streak badges
  {
    key: "streak_3",
    name: "Habit Former",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    rarity: BADGE_RARITY.COMMON,
    criteriaType: BADGE_CRITERIA.STREAK,
    criteriaValue: 3,
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    rarity: BADGE_RARITY.RARE,
    criteriaType: BADGE_CRITERIA.STREAK,
    criteriaValue: 7,
  },
  {
    key: "streak_30",
    name: "Consistency King",
    description: "Maintain a 30-day streak",
    icon: "👑",
    rarity: BADGE_RARITY.EPIC,
    criteriaType: BADGE_CRITERIA.STREAK,
    criteriaValue: 30,
  },
  {
    key: "streak_100",
    name: "Unstoppable",
    description: "Maintain a 100-day streak",
    icon: "🚀",
    rarity: BADGE_RARITY.LEGENDARY,
    criteriaType: BADGE_CRITERIA.STREAK,
    criteriaValue: 100,
  },

  // XP badges
  {
    key: "xp_100",
    name: "Novice",
    description: "Earn 100 XP",
    icon: "⭐",
    rarity: BADGE_RARITY.COMMON,
    criteriaType: BADGE_CRITERIA.XP_TOTAL,
    criteriaValue: 100,
  },
  {
    key: "xp_500",
    name: "Adept",
    description: "Earn 500 XP",
    icon: "💫",
    rarity: BADGE_RARITY.RARE,
    criteriaType: BADGE_CRITERIA.XP_TOTAL,
    criteriaValue: 500,
  },
  {
    key: "xp_1000",
    name: "Expert",
    description: "Earn 1,000 XP",
    icon: "✨",
    rarity: BADGE_RARITY.EPIC,
    criteriaType: BADGE_CRITERIA.XP_TOTAL,
    criteriaValue: 1000,
  },
  {
    key: "xp_5000",
    name: "Master",
    description: "Earn 5,000 XP",
    icon: "🌟",
    rarity: BADGE_RARITY.LEGENDARY,
    criteriaType: BADGE_CRITERIA.XP_TOTAL,
    criteriaValue: 5000,
  },

  // Domain level badges (will be created per domain)
  {
    key: "domain_level_5",
    name: "Domain Specialist",
    description: "Reach level 5 in any domain",
    icon: "🎯",
    rarity: BADGE_RARITY.RARE,
    criteriaType: BADGE_CRITERIA.DOMAIN_LEVEL,
    criteriaValue: 5,
  },
  {
    key: "domain_level_10",
    name: "Domain Expert",
    description: "Reach level 10 in any domain",
    icon: "🏆",
    rarity: BADGE_RARITY.EPIC,
    criteriaType: BADGE_CRITERIA.DOMAIN_LEVEL,
    criteriaValue: 10,
  },
];

/**
 * Check if user meets criteria for a badge
 */
async function checkBadgeCriteria(
  userId: string,
  criteriaType: string,
  criteriaValue: number,
  domainId?: string | null
): Promise<boolean> {
  const stats = await db.userStats.findUnique({
    where: { userId },
  });

  if (!stats) return false;

  switch (criteriaType) {
    case BADGE_CRITERIA.ITEM_COUNT:
      return stats.itemsProcessed >= criteriaValue;

    case BADGE_CRITERIA.STREAK:
      return stats.currentStreak >= criteriaValue || stats.longestStreak >= criteriaValue;

    case BADGE_CRITERIA.XP_TOTAL:
      return stats.totalXp >= criteriaValue;

    case BADGE_CRITERIA.DOMAIN_LEVEL:
      if (domainId) {
        // Check specific domain level
        const userDomain = await db.userDomain.findUnique({
          where: {
            userId_domainId: {
              userId,
              domainId,
            },
          },
        });
        return userDomain ? userDomain.level >= criteriaValue : false;
      } else {
        // Check if any domain has reached this level
        const userDomains = await db.userDomain.findMany({
          where: { userId },
        });
        return userDomains.some((ud) => ud.level >= criteriaValue);
      }

    default:
      return false;
  }
}

/**
 * Award a badge to a user if they meet the criteria and don't already have it
 */
export async function checkAndAwardBadge(
  userId: string,
  badgeKey: string
): Promise<{ awarded: boolean; badge?: any }> {
  // Get badge definition
  const badge = await db.badge.findUnique({
    where: { key: badgeKey },
  });

  if (!badge) {
    console.error(`Badge not found: ${badgeKey}`);
    return { awarded: false };
  }

  // Check if user already has this badge
  const existingUserBadge = await db.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      },
    },
  });

  if (existingUserBadge) {
    return { awarded: false };
  }

  // Check if user meets criteria
  const meetsCriteria = await checkBadgeCriteria(
    userId,
    badge.criteriaType,
    badge.criteriaValue || 0,
    badge.domainId
  );

  if (!meetsCriteria) {
    return { awarded: false };
  }

  // Award the badge
  const userBadge = await db.userBadge.create({
    data: {
      userId,
      badgeId: badge.id,
    },
  });

  console.log(`Badge awarded: ${badge.name} to user ${userId}`);

  return {
    awarded: true,
    badge: {
      ...badge,
      awardedAt: userBadge.awardedAt,
    },
  };
}

/**
 * Check all badges for a user and award any they're eligible for
 */
export async function checkAllBadges(userId: string): Promise<any[]> {
  const allBadges = await db.badge.findMany();
  const awardedBadges: any[] = [];

  for (const badge of allBadges) {
    const result = await checkAndAwardBadge(userId, badge.key);
    if (result.awarded && result.badge) {
      awardedBadges.push(result.badge);
    }
  }

  return awardedBadges;
}

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId: string) {
  const userBadges = await db.userBadge.findMany({
    where: { userId },
    include: {
      badge: {
        include: {
          domain: {
            select: {
              name: true,
              displayName: true,
              icon: true,
            },
          },
        },
      },
    },
    orderBy: {
      awardedAt: "desc",
    },
  });

  return userBadges.map((ub) => ({
    id: ub.badge.id,
    key: ub.badge.key,
    name: ub.badge.name,
    description: ub.badge.description,
    icon: ub.badge.icon,
    rarity: ub.badge.rarity,
    awardedAt: ub.awardedAt,
    seenAt: ub.seenAt,
    domain: ub.badge.domain,
  }));
}

/**
 * Get all available badges (for displaying badge collection/progress)
 * Cached with 1 hour TTL since badges rarely change
 */
export async function getAllBadges() {
  return cache.wrap(
    cacheKeys.allBadges(),
    async () => {
      const badges = await db.badge.findMany({
        include: {
          domain: {
            select: {
              name: true,
              displayName: true,
              icon: true,
            },
          },
        },
        orderBy: [{ rarity: "asc" }, { criteriaValue: "asc" }],
      });

      return badges;
    },
    3600 // 1 hour TTL
  );
}
