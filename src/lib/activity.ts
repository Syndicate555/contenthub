// Activity Tracking Service
// Centralized system for tracking user activities that count toward streaks

import { db } from "@/lib/db";
import { updateStreak, type UpdateStreakResult } from "@/lib/streak";

/**
 * Activity types that count toward maintaining streaks
 * Any of these activities performed in a day will maintain the user's streak
 */
export const STREAK_ACTIVITIES = {
  SAVE_ITEM: "save_item",           // User saves a new item
  PROCESS_ITEM: "process_item",     // User processes an item (AI enrichment)
  ADD_REFLECTION: "add_reflection", // User adds a note/reflection to an item
  REVIEW_ITEM: "review_item",       // User reviews/reads an item
  UPDATE_ITEM: "update_item",       // User updates item status or metadata
} as const;

export type StreakActivity = typeof STREAK_ACTIVITIES[keyof typeof STREAK_ACTIVITIES];

/**
 * Result of tracking an activity
 */
export interface TrackActivityResult {
  success: boolean;
  activityLogged: boolean;
  streakResult?: UpdateStreakResult;
  error?: string;
}

/**
 * Track a user activity that counts toward streak maintenance
 * This is the centralized function that should be called whenever a user
 * performs any activity that should count toward their daily streak.
 *
 * @param userId - The user's database ID
 * @param activity - Type of activity being performed
 * @param metadata - Optional metadata about the activity (itemId, etc.)
 * @returns Result including streak status
 *
 * @example
 * ```typescript
 * // When user saves an item
 * await trackActivity(userId, STREAK_ACTIVITIES.SAVE_ITEM, { itemId: item.id });
 *
 * // When user adds a reflection
 * await trackActivity(userId, STREAK_ACTIVITIES.ADD_REFLECTION, { itemId: item.id });
 * ```
 */
export async function trackActivity(
  userId: string,
  activity: StreakActivity,
  metadata?: Record<string, any>
): Promise<TrackActivityResult> {
  try {
    // Update the user's streak
    // The streak logic handles checking if this is the first activity today
    const streakResult = await updateStreak(userId);

    console.log(`Activity tracked: ${activity} for user ${userId}`, {
      currentStreak: streakResult.currentStreak,
      maintained: streakResult.streakMaintained,
      firstToday: streakResult.firstActivityToday,
    });

    return {
      success: true,
      activityLogged: true,
      streakResult,
    };
  } catch (error) {
    console.error(`Failed to track activity ${activity} for user ${userId}:`, error);

    return {
      success: false,
      activityLogged: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's activity status for today
 * Useful for determining if user needs to perform an activity to maintain streak
 */
export async function getTodayActivityStatus(userId: string): Promise<{
  hasActivityToday: boolean;
  lastActivityAt: Date | null;
  currentStreak: number;
  timezone: string;
}> {
  const stats = await db.userStats.findUnique({
    where: { userId },
    select: {
      lastActivityAt: true,
      currentStreak: true,
      timezone: true,
    },
  });

  if (!stats) {
    return {
      hasActivityToday: false,
      lastActivityAt: null,
      currentStreak: 0,
      timezone: "UTC",
    };
  }

  const now = new Date();
  const timezone = stats.timezone || "UTC";

  // Check if last activity was today in user's timezone
  let hasActivityToday = false;
  if (stats.lastActivityAt) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const todayStr = formatter.format(now);
    const lastActivityStr = formatter.format(stats.lastActivityAt);
    hasActivityToday = todayStr === lastActivityStr;
  }

  return {
    hasActivityToday,
    lastActivityAt: stats.lastActivityAt,
    currentStreak: stats.currentStreak,
    timezone,
  };
}

/**
 * Get activity history for a user (for calendar view)
 * Returns dates where user had activity, useful for visualization
 */
export async function getActivityHistory(
  userId: string,
  days: number = 90
): Promise<Date[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all XP events (which represent activities) in the date range
  const events = await db.xPEvent.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Get unique dates (in UTC for consistency)
  const uniqueDates = new Map<string, Date>();

  events.forEach((event) => {
    const dateStr = event.createdAt.toISOString().split("T")[0];
    if (!uniqueDates.has(dateStr)) {
      uniqueDates.set(dateStr, event.createdAt);
    }
  });

  return Array.from(uniqueDates.values());
}
