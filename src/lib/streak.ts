// Streak Tracking Service
// Manages daily activity streaks for users

import { db } from "@/lib/db";
import { awardXP, XP_ACTIONS } from "@/lib/xp";

/**
 * Check if two dates are on the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if two dates are consecutive days
 */
function isConsecutiveDay(yesterday: Date, today: Date): boolean {
  const dayBefore = new Date(yesterday);
  dayBefore.setDate(dayBefore.getDate() + 1);
  return isSameDay(dayBefore, today);
}

/**
 * Get the start of day in user's timezone (simplified - uses UTC for now)
 */
function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
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
 * - Maintains streak if activity on consecutive days
 * - Resets streak if more than 1 day gap
 * - Awards XP for maintaining streak
 */
export async function updateStreak(userId: string): Promise<UpdateStreakResult> {
  const now = new Date();
  const today = getStartOfDay(now);

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

  // Check if this is the first activity today
  const lastActivity = stats.lastActivityAt;
  const firstActivityToday = !lastActivity || !isSameDay(lastActivity, now);

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
    const lastActivityDay = getStartOfDay(lastActivity);

    if (isConsecutiveDay(lastActivityDay, today)) {
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
            date: today.toISOString(),
          },
        });
      } catch (error) {
        console.error("Failed to award streak XP:", error);
      }
    } else if (isSameDay(lastActivityDay, today)) {
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
    },
  });

  if (!stats) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      isActive: false,
      daysUntilReset: 0,
    };
  }

  // Check if streak is still active (activity within last 24 hours)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const isActive = stats.lastActivityAt
    ? stats.lastActivityAt > oneDayAgo
    : false;

  // Calculate days until reset (if no activity today)
  let daysUntilReset = 0;
  if (stats.lastActivityAt) {
    const lastActivityDay = getStartOfDay(stats.lastActivityAt);
    const today = getStartOfDay(now);
    const daysSinceActivity = Math.floor(
      (today.getTime() - lastActivityDay.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceActivity === 0) {
      // Activity today - safe for rest of day
      daysUntilReset = 0;
    } else if (daysSinceActivity === 1) {
      // Activity yesterday - need activity today to maintain
      daysUntilReset = 0; // Already at risk
    } else {
      // Streak already broken
      daysUntilReset = 0;
    }
  }

  return {
    ...stats,
    isActive,
    daysUntilReset,
  };
}
