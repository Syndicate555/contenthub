import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { DEMO_USER_CLERK_ID, createDemoToken } from "@/lib/demo-jwt";

/**
 * DEV ONLY: Impersonate the demo user in the webapp
 * This allows you to add content as the demo user through the normal UI
 *
 * IMPORTANT: Remove or disable this in production!
 */
export async function POST() {
  // Only allow in development
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    return NextResponse.json(
      { ok: false, error: "Only available in development" },
      { status: 403 },
    );
  }

  try {
    const demoUser = await db.user.findUnique({
      where: { clerkId: DEMO_USER_CLERK_ID },
    });

    if (!demoUser) {
      return NextResponse.json(
        { ok: false, error: "Demo user not found" },
        { status: 404 },
      );
    }

    // Create a demo token
    const token = createDemoToken(demoUser.id, 24 * 7); // 7 days for development

    // Set as cookie so the webapp uses it
    const cookieStore = await cookies();
    cookieStore.set("demo_impersonation_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      message: "Impersonating demo user. Refresh the page.",
      user: {
        id: demoUser.id,
        email: demoUser.email,
      },
    });
  } catch (error) {
    console.error("POST /api/dev/impersonate-demo error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to impersonate demo user" },
      { status: 500 },
    );
  }
}

// Stop impersonation
export async function DELETE() {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    return NextResponse.json(
      { ok: false, error: "Only available in development" },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete("demo_impersonation_token");

  return NextResponse.json({
    ok: true,
    message: "Stopped impersonating demo user. Refresh the page.",
  });
}
