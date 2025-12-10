// XP System - Constants and Service
// Handles all XP-related calculations and database operations

import { db } from "@/lib/db";

// ============================================
// XP ACTION VALUES
// ============================================

export const XP_ACTIONS = {
  // Content actions
  SAVE_ITEM: "save_item",
  PROCESS_ITEM: "process_item",
  ADD_REFLECTION: "add_reflection",

  // Quest actions
  COMPLETE_DAILY_QUEST: "complete_daily_quest",
  COMPLETE_WEEKLY_QUEST: "complete_weekly_quest",

  // Streak actions
  MAINTAIN_STREAK: "maintain_streak",

  // Special actions
  FIRST_ITEM_OF_DAY: "first_item_of_day",
  FOCUS_AREA_BONUS: "focus_area_bonus",
} as const;

export type XPAction = (typeof XP_ACTIONS)[keyof typeof XP_ACTIONS];

// XP values for each action
export const XP_VALUES: Record<XPAction, number> = {
  [XP_ACTIONS.SAVE_ITEM]: 5,
  [XP_ACTIONS.PROCESS_ITEM]: 10,
  [XP_ACTIONS.ADD_REFLECTION]: 15,
  [XP_ACTIONS.COMPLETE_DAILY_QUEST]: 25,
  [XP_ACTIONS.COMPLETE_WEEKLY_QUEST]: 100,
  [XP_ACTIONS.MAINTAIN_STREAK]: 10,
  [XP_ACTIONS.FIRST_ITEM_OF_DAY]: 5,
  [XP_ACTIONS.FOCUS_AREA_BONUS]: 5, // Extra XP for focus area items
};

// ============================================
// LEVEL PROGRESSION
// ============================================

// XP thresholds for each level (exponential growth)
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  1750, // Level 6
  2750, // Level 7
  4000, // Level 8
  5500, // Level 9
  7500, // Level 10
  10000, // Level 11
  13000, // Level 12
  16500, // Level 13
  20500, // Level 14
  25000, // Level 15
  30000, // Level 16
  36000, // Level 17
  43000, // Level 18
  51000, // Level 19
  60000, // Level 20
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXpForNextLevel(currentXp: number): {
  currentLevel: number;
  nextLevelXp: number;
  xpNeeded: number;
  progress: number;
} {
  const currentLevel = calculateLevel(currentXp);

  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel: MAX_LEVEL,
      nextLevelXp: LEVEL_THRESHOLDS[MAX_LEVEL - 1],
      xpNeeded: 0,
      progress: 100,
    };
  }

  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelXp = LEVEL_THRESHOLDS[currentLevel];
  const xpInCurrentLevel = currentXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const progress = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

  return {
    currentLevel,
    nextLevelXp,
    xpNeeded: nextLevelXp - currentXp,
    progress,
  };
}

// ============================================
// XP SERVICE
// ============================================

export interface AwardXPParams {
  userId: string;
  action: XPAction;
  domainId?: string | null;
  itemId?: string | null;
  questId?: string | null;
  metadata?: Record<string, unknown>;
  customAmount?: number; // Override default XP amount
}

export interface AwardXPResult {
  xpAwarded: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  previousLevel: number;
  domainXp?: number;
  domainLevel?: number;
}

/**
 * Award XP to a user
 * - Creates XP event record
 * - Updates UserStats
 * - Updates UserDomain if domainId provided
 * - Returns level up info
 */
export async function awardXP(params: AwardXPParams): Promise<AwardXPResult> {
  const { userId, action, domainId, itemId, questId, metadata, customAmount } =
    params;

  // Determine XP amount
  const xpAmount = customAmount ?? XP_VALUES[action] ?? 0;

  // Get or create user stats
  const userStats = await db.userStats.findUnique({
    where: { userId },
  });

  const previousLevel = userStats?.overallLevel ?? 1;
  const previousXp = userStats?.totalXp ?? 0;

  // Calculate new totals
  const newTotalXp = previousXp + xpAmount;
  const newLevel = calculateLevel(newTotalXp);
  const levelUp = newLevel > previousLevel;

  // Prepare stats update based on action
  const statsUpdate: Record<string, unknown> = {
    totalXp: newTotalXp,
    overallLevel: newLevel,
    lastActivityAt: new Date(),
  };

  // Increment specific counters based on action
  switch (action) {
    case XP_ACTIONS.SAVE_ITEM:
      statsUpdate.itemsSaved = { increment: 1 };
      break;
    case XP_ACTIONS.PROCESS_ITEM:
      statsUpdate.itemsProcessed = { increment: 1 };
      break;
    case XP_ACTIONS.ADD_REFLECTION:
      statsUpdate.reflections = { increment: 1 };
      break;
    case XP_ACTIONS.COMPLETE_DAILY_QUEST:
    case XP_ACTIONS.COMPLETE_WEEKLY_QUEST:
      statsUpdate.questsCompleted = { increment: 1 };
      break;
  }

  // Transaction to ensure consistency
  const result = await db.$transaction(async (tx) => {
    // Create XP event
    await tx.xPEvent.create({
      data: {
        userId,
        action,
        xpAmount,
        domainId: domainId ?? undefined,
        itemId: itemId ?? undefined,
        questId: questId ?? undefined,
        metadata: metadata as object | undefined,
      },
    });

    // Upsert user stats
    await tx.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: newTotalXp,
        overallLevel: newLevel,
        itemsSaved: action === XP_ACTIONS.SAVE_ITEM ? 1 : 0,
        itemsProcessed: action === XP_ACTIONS.PROCESS_ITEM ? 1 : 0,
        reflections: action === XP_ACTIONS.ADD_REFLECTION ? 1 : 0,
        questsCompleted:
          action === XP_ACTIONS.COMPLETE_DAILY_QUEST ||
          action === XP_ACTIONS.COMPLETE_WEEKLY_QUEST
            ? 1
            : 0,
        lastActivityAt: new Date(),
      },
      update: statsUpdate,
    });

    // Update domain stats if domainId provided
    let domainXp: number | undefined;
    let domainLevel: number | undefined;

    if (domainId) {
      const userDomain = await tx.userDomain.upsert({
        where: {
          userId_domainId: { userId, domainId },
        },
        create: {
          userId,
          domainId,
          totalXp: xpAmount,
          level: 1,
          itemCount: action === XP_ACTIONS.PROCESS_ITEM ? 1 : 0,
        },
        update: {
          totalXp: { increment: xpAmount },
          itemCount:
            action === XP_ACTIONS.PROCESS_ITEM ? { increment: 1 } : undefined,
        },
      });

      // Recalculate domain level
      const newDomainLevel = calculateLevel(userDomain.totalXp);
      if (newDomainLevel !== userDomain.level) {
        await tx.userDomain.update({
          where: { id: userDomain.id },
          data: { level: newDomainLevel },
        });
      }

      domainXp = userDomain.totalXp;
      domainLevel = newDomainLevel;
    }

    return { domainXp, domainLevel };
  });

  return {
    xpAwarded: xpAmount,
    totalXp: newTotalXp,
    level: newLevel,
    levelUp,
    previousLevel,
    domainXp: result.domainXp,
    domainLevel: result.domainLevel,
  };
}

/**
 * Get user's current stats
 */
export async function getUserStats(userId: string) {
  const stats = await db.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    // Return default stats if none exist
    return {
      totalXp: 0,
      overallLevel: 1,
      itemsSaved: 0,
      itemsProcessed: 0,
      reflections: 0,
      questsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      levelProgress: getXpForNextLevel(0),
    };
  }

  return {
    ...stats,
    levelProgress: getXpForNextLevel(stats.totalXp),
  };
}

/**
 * Get user's domain stats
 */
export async function getUserDomainStats(userId: string) {
  const domains = await db.userDomain.findMany({
    where: { userId },
    include: {
      domain: {
        select: {
          id: true,
          name: true,
          displayName: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { totalXp: "desc" },
  });

  return domains.map((d) => ({
    ...d,
    levelProgress: getXpForNextLevel(d.totalXp),
  }));
}

/**
 * Get user's recent XP events
 */
export async function getRecentXPEvents(userId: string, limit: number = 20) {
  return db.xPEvent.findMany({
    where: { userId },
    include: {
      domain: {
        select: {
          name: true,
          displayName: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Check if an item is in user's focus area (for bonus XP)
 */
export async function isInFocusArea(
  userId: string,
  domainId: string,
): Promise<boolean> {
  const focusArea = await db.focusArea.findUnique({
    where: {
      userId_domainId: { userId, domainId },
    },
  });

  return !!focusArea;
}
