/**
 * POST /api/demo/session/refresh
 * Refreshes a demo token with a new 30-minute sliding window
 * Rate limited: 5/min, 30/hour per IP
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyDemoToken,
  createDemoToken,
  getRemainingTime,
  DEMO_TOKEN_EXPIRY_MINUTES,
} from "@/lib/demo-jwt";
import { db } from "@/lib/db";
import { INACTIVITY_TIMEOUT_MS } from "@/lib/session-activity";
import { applyStandardRateLimit } from "@/lib/rate-limit-helpers";

const REFRESH_THRESHOLD_SECONDS = 10 * 60; // Allow refresh when <10 min remaining

export async function POST(request: NextRequest) {
  // Rate limit: 5/min, 30/hour per IP
  const rateLimitResult = await applyStandardRateLimit(
    request,
    null,
    "public",
    { perMinute: 5, perHour: 30 },
  );

  if (rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Get token from Authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify current token
  const payload = verifyDemoToken(token);

  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  // Check remaining time
  const remainingSeconds = getRemainingTime(payload);

  if (remainingSeconds === null) {
    return NextResponse.json(
      { ok: false, error: "Token has expired" },
      { status: 401 },
    );
  }

  // Only allow refresh if less than 10 minutes remaining
  if (remainingSeconds > REFRESH_THRESHOLD_SECONDS) {
    return NextResponse.json({
      ok: false,
      error: "Token refresh not needed yet",
      refreshed: false,
      remainingSeconds,
      expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
    });
  }

  try {
    // Issue new token with fresh 30-minute expiry
    const newToken = createDemoToken(payload.userId, DEMO_TOKEN_EXPIRY_MINUTES);
    const newPayload = verifyDemoToken(newToken);

    if (!newPayload) {
      throw new Error("Failed to create new token");
    }

    // Update SessionActivity
    const sessionActivity = await db.sessionActivity.findFirst({
      where: {
        userId: payload.userId,
        sessionId: payload.tokenId,
        isDemo: true,
        terminatedAt: null,
      },
    });

    if (sessionActivity) {
      const newExpiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_MS);

      await db.sessionActivity.update({
        where: { id: sessionActivity.id },
        data: {
          sessionId: newPayload.tokenId, // Update to new token ID
          lastActivityAt: new Date(),
          lastActivityType: "refresh",
          expiresAt: newExpiresAt,
        },
      });
    } else {
      // Create new SessionActivity for refreshed token
      const newExpiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_MS);

      await db.sessionActivity.create({
        data: {
          userId: payload.userId,
          sessionId: newPayload.tokenId,
          isDemo: true,
          lastActivityAt: new Date(),
          lastActivityType: "refresh",
          expiresAt: newExpiresAt,
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: "demo_token_refreshed",
        resource: `demo_token:${payload.tokenId}`,
        metadata: {
          oldTokenId: payload.tokenId,
          newTokenId: newPayload.tokenId,
          oldExpiry: new Date((payload.exp ?? 0) * 1000).toISOString(),
          newExpiry: new Date((newPayload.exp ?? 0) * 1000).toISOString(),
        },
        success: true,
      },
    });

    return NextResponse.json({
      ok: true,
      token: newToken,
      expiresAt: new Date((newPayload.exp ?? 0) * 1000).toISOString(),
      refreshed: true,
    });
  } catch (error) {
    console.error("[API /demo/session/refresh] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Token refresh failed" },
      { status: 500 },
    );
  }
}
