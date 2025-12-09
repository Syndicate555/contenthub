// Streak Tracking Service
// Manages daily activity streaks for users with timezone-aware calculations

import { db } from "@/lib/db";
import { awardXP, XP_ACTIONS } from "@/lib/xp";
import {
  isSameDayInTimezone,
  isConsecutiveDayInTimezone,
} from "@/lib/timezone";

/**
 * Get user's timezone from database
 */
async function getUserTimezone(userId: string): Promise<string> {
  const stats = await db.userStats.findUnique({
    where: { userId },
    select: { timezone: true },
  });

  return stats?.timezone || "UTC";
}

export interface UpdateStreakResult {
  currentStreak: number;
  longestStreak: number;
  streakMaintained: boolean;
  streakBroken: boolean;
  firstActivityToday: boolean;
}

/**
 * Update user's streak when they perform an activity
 * - Maintains streak if activity on consecutive days (in user's timezone)
 * - Resets streak if more than 1 day gap
 * - Awards XP for maintaining streak
 */
export async function updateStreak(
  userId: string,
): Promise<UpdateStreakResult> {
  const now = new Date();

  // Get user's timezone
  const timezone = await getUserTimezone(userId);

  // Get current stats
  let stats = await db.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    // Create initial stats if doesn't exist
    stats = await db.userStats.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: now,
        timezone,
      },
    });

    return {
      currentStreak: 1,
      longestStreak: 1,
      streakMaintained: false,
      streakBroken: false,
      firstActivityToday: true,
    };
  }

  // Check if this is the first activity today (in user's timezone)
  const lastActivity = stats.lastActivityAt;
  const firstActivityToday =
    !lastActivity || !isSameDayInTimezone(lastActivity, now, timezone);

  // If not first activity today, just update lastActivityAt and return current streak
  if (!firstActivityToday) {
    await db.userStats.update({
      where: { userId },
      data: { lastActivityAt: now },
    });

    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakMaintained: false,
      streakBroken: false,
      firstActivityToday: false,
    };
  }

  // First activity today - check streak status
  let newCurrentStreak = stats.currentStreak;
  let streakMaintained = false;
  let streakBroken = false;

  if (!lastActivity) {
    // No previous activity - start new streak
    newCurrentStreak = 1;
  } else {
    // Check if yesterday and today are consecutive days in user's timezone
    if (isConsecutiveDayInTimezone(lastActivity, now, timezone)) {
      // Consecutive day - maintain streak
      newCurrentStreak = stats.currentStreak + 1;
      streakMaintained = true;

      // Award streak maintenance XP
      try {
        await awardXP({
          userId,
          action: XP_ACTIONS.MAINTAIN_STREAK,
          metadata: {
            currentStreak: newCurrentStreak,
            date: now.toISOString(),
            timezone,
          },
        });
      } catch (error) {
        console.error("Failed to award streak XP:", error);
      }
    } else if (isSameDayInTimezone(lastActivity, now, timezone)) {
      // Same day - no change (shouldn't happen due to earlier check)
      newCurrentStreak = stats.currentStreak;
    } else {
      // Gap in activity - streak broken, restart
      newCurrentStreak = 1;
      streakBroken = true;
    }
  }

  // Update longest streak if current streak is higher
  const newLongestStreak = Math.max(stats.longestStreak, newCurrentStreak);

  // Update stats
  await db.userStats.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityAt: now,
    },
  });

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    streakMaintained,
    streakBroken,
    firstActivityToday: true,
  };
}

/**
 * Get user's current streak information
 */
export async function getUserStreak(userId: string) {
  const stats = await db.userStats.findUnique({
    where: { userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityAt: true,
      timezone: true,
    },
  });

  if (!stats) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      isActive: false,
      timezone: "UTC",
    };
  }

  // Check if streak is still active (activity within last 24 hours in user's timezone)
  const now = new Date();
  const timezone = stats.timezone || "UTC";

  // If no last activity, streak is not active
  if (!stats.lastActivityAt) {
    return {
      ...stats,
      isActive: false,
      timezone,
    };
  }

  // Check if last activity was today or yesterday in user's timezone
  const isToday = isSameDayInTimezone(stats.lastActivityAt, now, timezone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = isSameDayInTimezone(
    stats.lastActivityAt,
    yesterday,
    timezone,
  );

  const isActive = isToday || wasYesterday;

  return {
    ...stats,
    isActive,
    timezone,
  };
}

/**
 * Update user's timezone preference
 */
export async function updateUserTimezone(
  userId: string,
  timezone: string,
): Promise<void> {
  await db.userStats.upsert({
    where: { userId },
    create: {
      userId,
      timezone,
    },
    update: {
      timezone,
    },
  });
}
