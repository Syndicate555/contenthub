/**
 * POST /api/session/activity
 * Records user activity to extend session timeout
 * Rate limited: 10/min, 200/hour per user
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateSessionActivity } from "@/lib/session-validation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applyStandardRateLimit } from "@/lib/rate-limit-helpers";
import { INACTIVITY_TIMEOUT_MS } from "@/lib/session-activity";
import type { ActivityType } from "@/lib/session-activity";

type RequestBody = {
  timestamp: number;
  type?: ActivityType;
};

export async function POST(request: NextRequest) {
  // Rate limit: 10/min, 200/hour
  const user = await getCurrentUser();
  const rateLimitResult = await applyStandardRateLimit(
    request,
    user?.id ?? null,
    "write",
    { perMinute: 10, perHour: 200 },
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

  // Parse request body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { timestamp, type = "api_call" } = body;

  if (!timestamp || typeof timestamp !== "number") {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid timestamp" },
      { status: 400 },
    );
  }

  // Get client metadata
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0];
  const userAgent = request.headers.get("user-agent");

  try {
    // Get or create session activity
    const sessionActivity = await getOrCreateSessionActivity(
      user.id,
      sessionId,
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined },
    );

    // Update activity timestamp and extend expiration
    const newExpiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_MS);

    await db.sessionActivity.update({
      where: { id: sessionActivity.id },
      data: {
        lastActivityAt: new Date(timestamp),
        lastActivityType: type,
        expiresAt: newExpiresAt,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });

    // Update UserStats.lastActivityAt
    await db.userStats.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        lastActivityAt: new Date(timestamp),
      },
      update: {
        lastActivityAt: new Date(timestamp),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /session/activity] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
