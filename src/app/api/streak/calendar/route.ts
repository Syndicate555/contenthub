import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActivityHistory } from "@/lib/activity";

/**
 * GET /api/streak/calendar - Get user's activity calendar data
 * Returns dates where user had activity for visual calendar display
 *
 * Query params:
 * - days: number of days to fetch (default: 90)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90");

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { ok: false, error: "Days must be between 1 and 365" },
        { status: 400 },
      );
    }

    // Get activity history
    const activityDates = await getActivityHistory(user.id, days);

    // Convert dates to ISO strings for consistent JSON serialization
    const activityDateStrings = activityDates.map(
      (date) => date.toISOString().split("T")[0],
    );

    return NextResponse.json({
      ok: true,
      data: {
        activityDates: activityDateStrings,
        daysRequested: days,
        totalActiveDays: activityDateStrings.length,
      },
    });
  } catch (error) {
    console.error("GET /api/streak/calendar error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch calendar data" },
      { status: 500 },
    );
  }
}
