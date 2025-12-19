import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createDemoToken, DEMO_USER_CLERK_ID } from "@/lib/demo-jwt";

export async function POST() {
  try {
    const demoUser = await db.user.findUnique({
      where: { clerkId: DEMO_USER_CLERK_ID },
      select: {
        id: true,
        email: true,
      },
    });

    if (!demoUser) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Demo user not found. Please run the demo user migration script.",
        },
        { status: 500 },
      );
    }

    const token = createDemoToken(demoUser.id);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return NextResponse.json({
      ok: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: demoUser.id,
        email: demoUser.email,
      },
    });
  } catch (error) {
    console.error("POST /api/demo/session error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to create demo session",
      },
      { status: 500 },
    );
  }
}
