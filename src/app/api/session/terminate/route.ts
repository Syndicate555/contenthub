/**
 * POST /api/session/terminate
 * Terminates the current session and logs the reason
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type RequestBody = {
  reason: "timeout" | "logout";
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

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

  const { reason } = body;

  if (!reason || !["timeout", "logout"].includes(reason)) {
    return NextResponse.json(
      { ok: false, error: "Invalid reason. Must be 'timeout' or 'logout'" },
      { status: 400 },
    );
  }

  try {
    // Find session activity
    const sessionActivity = await db.sessionActivity.findFirst({
      where: {
        userId: user.id,
        sessionId,
        terminatedAt: null,
      },
    });

    if (sessionActivity) {
      // Mark session as terminated
      await db.sessionActivity.update({
        where: { id: sessionActivity.id },
        data: {
          terminatedAt: new Date(),
          terminationReason: reason,
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "session_terminated",
        resource: `session:${sessionId}`,
        metadata: {
          reason,
          terminatedAt: new Date().toISOString(),
        },
        success: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /session/terminate] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
