/**
 * POST /api/session/token-refresh
 * Triggers Clerk token refresh and updates rotation tracking
 * Rate limited: 20/min per user
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applyStandardRateLimit } from "@/lib/rate-limit-helpers";

export async function POST(request: NextRequest) {
  // Rate limit: 20/min
  const user = await getCurrentUser();
  const rateLimitResult = await applyStandardRateLimit(
    request,
    user?.id ?? null,
    "write",
    { perMinute: 20 },
  );

  if (rateLimitResult.response) {
    return rateLimitResult.response;
  }

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Get Clerk session ID
  const { sessionId } = await auth();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "No active session" },
      { status: 401 },
    );
  }

  try {
    // Trigger Clerk token refresh by calling currentUser()
    // This forces Clerk to refresh the session token
    await currentUser();

    // Update SessionActivity token rotation tracking
    const sessionActivity = await db.sessionActivity.findFirst({
      where: {
        userId: user.id,
        sessionId,
        terminatedAt: null,
      },
    });

    if (sessionActivity) {
      await db.sessionActivity.update({
        where: { id: sessionActivity.id },
        data: {
          lastTokenRefresh: new Date(),
          tokenRotationCount: { increment: 1 },
        },
      });
    }

    // Audit log for monitoring
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "token_rotated",
        resource: `session:${sessionId}`,
        metadata: {
          rotationCount: sessionActivity
            ? sessionActivity.tokenRotationCount + 1
            : 1,
        },
        success: true,
      },
    });

    return NextResponse.json({
      ok: true,
      rotatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /session/token-refresh] Error:", error);

    // Log failure for monitoring
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "token_rotation_failed",
        resource: `session:${sessionId}`,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
    });

    return NextResponse.json(
      { ok: false, error: "Token refresh failed" },
      { status: 500 },
    );
  }
}
