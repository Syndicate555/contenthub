/**
 * Server-side session validation for auto-logout enforcement
 * Validates sessions against activity timestamps and Clerk status
 */

import { db } from "./db";
import { INACTIVITY_TIMEOUT_MS } from "./session-activity";

export type SessionValidationResult = {
  valid: boolean;
  reason?: "timeout" | "no_session" | "terminated";
};

/**
 * Validate a session by checking activity timestamps
 * Checks:
 * 1. SessionActivity lastActivityAt against timeout threshold
 * 2. Session termination status
 *
 * @param clerkId - The Clerk user ID
 * @param sessionId - The Clerk session ID
 */
export async function validateSession(
  clerkId: string,
  sessionId: string,
): Promise<SessionValidationResult> {
  if (!clerkId || !sessionId) {
    return { valid: false, reason: "no_session" };
  }

  // Get user from database
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    // User doesn't exist in database yet (Clerk webhook hasn't fired)
    // Trust Clerk's authentication - user record will be created by webhook
    return { valid: true };
  }

  // Check SessionActivity for this Clerk session
  const sessionActivity = await db.sessionActivity.findFirst({
    where: {
      userId: user.id,
      sessionId,
      terminatedAt: null, // Not terminated
    },
    orderBy: {
      lastActivityAt: "desc",
    },
  });

  // No session activity record yet (may not have been created)
  if (!sessionActivity) {
    // Session is valid if Clerk says it's valid
    // SessionActivity will be created on first API call
    return { valid: true };
  }

  // Check if session was terminated
  if (sessionActivity.terminatedAt !== null) {
    return { valid: false, reason: "terminated" };
  }

  // Check inactivity timeout
  const timeSinceActivity =
    Date.now() - sessionActivity.lastActivityAt.getTime();

  if (timeSinceActivity > INACTIVITY_TIMEOUT_MS) {
    // Session timed out - mark as terminated
    await db.sessionActivity.update({
      where: { id: sessionActivity.id },
      data: {
        terminatedAt: new Date(),
        terminationReason: "timeout",
      },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "session_terminated",
        resource: `session:${sessionId}`,
        metadata: {
          reason: "timeout",
          lastActivityAt: sessionActivity.lastActivityAt.toISOString(),
          timeSinceActivity,
        },
        success: true,
      },
    });

    return { valid: false, reason: "timeout" };
  }

  // Session is valid
  return { valid: true };
}

/**
 * Get or create SessionActivity for current session
 * Used by activity recording endpoint
 */
export async function getOrCreateSessionActivity(
  userId: string,
  sessionId: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  },
) {
  // Try to find existing session activity
  let sessionActivity = await db.sessionActivity.findFirst({
    where: {
      userId,
      sessionId,
      terminatedAt: null,
    },
  });

  if (!sessionActivity) {
    // Create new session activity record
    const expiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_MS);

    sessionActivity = await db.sessionActivity.create({
      data: {
        userId,
        sessionId,
        isDemo: false,
        lastActivityAt: new Date(),
        lastActivityType: "api_call",
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
      },
    });
  }

  return sessionActivity;
}
