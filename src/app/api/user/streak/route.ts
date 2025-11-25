import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStreak } from "@/lib/streak";

// GET /api/user/streak - Get user's streak information
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const streakInfo = await getUserStreak(user.id);

    return NextResponse.json({
      ok: true,
      data: streakInfo,
    });
  } catch (error) {
    console.error("GET /api/user/streak error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch streak" },
      { status: 500 }
    );
  }
}
