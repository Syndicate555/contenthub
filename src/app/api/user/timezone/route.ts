import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isValidTimezone } from "@/lib/timezone";
import { updateUserTimezone } from "@/lib/streak";

/**
 * POST /api/user/timezone - Update user's timezone preference
 */
export async function POST(request: NextRequest) {
  let user = null;
  let timezone = null;

  try {
    // Get authenticated user
    user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    timezone = body.timezone;

    // Validate timezone
    if (!timezone || typeof timezone !== "string") {
      return NextResponse.json(
        { ok: false, error: "Timezone is required" },
        { status: 400 },
      );
    }

    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { ok: false, error: "Invalid IANA timezone identifier" },
        { status: 400 },
      );
    }

    // Update user's timezone
    await updateUserTimezone(user.id, timezone);

    return NextResponse.json({
      ok: true,
      data: { timezone },
    });
  } catch (error) {
    console.error("POST /api/user/timezone error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id,
      timezone,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to update timezone",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
