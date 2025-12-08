import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/badges/mark-seen - Mark badges as seen by the user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { badgeIds } = body;

    // Validate badgeIds
    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "badgeIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Mark all specified badges as seen
    const result = await db.userBadge.updateMany({
      where: {
        userId: user.id,
        badgeId: { in: badgeIds },
        seenAt: null, // Only update if not already seen
      },
      data: {
        seenAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        markedCount: result.count,
      },
    });
  } catch (error) {
    console.error("POST /api/badges/mark-seen error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to mark badges as seen" },
      { status: 500 }
    );
  }
}
