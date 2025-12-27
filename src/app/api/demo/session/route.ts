import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createDemoToken, DEMO_USER_CLERK_ID } from "@/lib/demo-jwt";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  // Check rate limit: 1/min and 10/hour per IP
  const rateLimitResult = await checkRateLimit({
    identifier: ipAddress,
    endpoint,
    limits: {
      perMinute: 1,
      perHour: 10,
    },
    metadata: {
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    },
  });

  if (!rateLimitResult.success) {
    await logRateLimitViolation(
      null,
      ipAddress,
      endpoint,
      request.headers.get("user-agent"),
    );
    return createRateLimitResponse(rateLimitResult);
  }

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

    // Add rate limit headers to success response
    const response = NextResponse.json({
      ok: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: demoUser.id,
        email: demoUser.email,
      },
    });

    return addRateLimitHeaders(response, rateLimitResult);
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
