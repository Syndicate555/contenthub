import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTodayActivityStatus } from "@/lib/activity";
import { getEndOfDayInTimezone } from "@/lib/timezone";

/**
 * GET /api/streak/status - Get user's current streak status with warning info
 * Returns:
 * - Current streak count
 * - Whether user has activity today
 * - Hours remaining in day
 * - Warning level (none | mild | urgent)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get today's activity status
    const activityStatus = await getTodayActivityStatus(user.id);

    const now = new Date();
    const timezone = activityStatus.timezone;

    // Calculate hours remaining until end of day in user's timezone
    const endOfDay = getEndOfDayInTimezone(timezone);
    const msRemaining = endOfDay.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, msRemaining / (1000 * 60 * 60));

    // Determine warning level
    let warningLevel: "none" | "mild" | "urgent" = "none";
    let warningMessage: string | null = null;

    if (!activityStatus.hasActivityToday && activityStatus.currentStreak > 0) {
      // User has an active streak but no activity today
      if (hoursRemaining < 2) {
        warningLevel = "urgent";
        warningMessage = `Only ${Math.floor(hoursRemaining * 60)} minutes left to maintain your ${activityStatus.currentStreak}-day streak!`;
      } else if (hoursRemaining < 6) {
        warningLevel = "mild";
        warningMessage = `${Math.floor(hoursRemaining)} hours left to maintain your ${activityStatus.currentStreak}-day streak`;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        currentStreak: activityStatus.currentStreak,
        hasActivityToday: activityStatus.hasActivityToday,
        lastActivityAt: activityStatus.lastActivityAt,
        hoursRemaining: Math.floor(hoursRemaining * 10) / 10, // Round to 1 decimal
        warningLevel,
        warningMessage,
        timezone,
      },
    });
  } catch (error) {
    console.error("GET /api/streak/status error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch streak status" },
      { status: 500 }
    );
  }
}
