/**
 * Twitter Connection API
 * POST /api/connections/twitter/sync - Trigger bookmark sync
 * DELETE /api/connections/twitter - Disconnect Twitter
 */

import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncTwitterBookmarks } from "@/lib/twitter-sync";
import { disconnectTwitter } from "@/lib/twitter-api";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";

/**
 * POST - Trigger a sync of Twitter bookmarks
 */
export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check rate limit: 3/hour per user
    const rateLimitResult = await checkRateLimit({
      identifier: user.id,
      endpoint,
      limits: {
        perHour: 3,
      },
      metadata: {
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (!rateLimitResult.success) {
      await logRateLimitViolation(
        user.id,
        ipAddress,
        endpoint,
        request.headers.get("user-agent"),
      );
      return createRateLimitResponse(rateLimitResult);
    }

    // Trigger sync
    const result = await syncTwitterBookmarks(user.id);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: result.errors[0],
          data: result,
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      data: result,
    });

    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("Error syncing Twitter:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync Twitter bookmarks" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Disconnect Twitter account
 */
export async function DELETE(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check rate limit: 10/day per user
    const rateLimitResult = await checkRateLimit({
      identifier: user.id,
      endpoint,
      limits: {
        perDay: 10,
      },
      metadata: {
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (!rateLimitResult.success) {
      await logRateLimitViolation(
        user.id,
        ipAddress,
        endpoint,
        request.headers.get("user-agent"),
      );
      return createRateLimitResponse(rateLimitResult);
    }

    // Disconnect Twitter
    await disconnectTwitter(user.id);

    const response = NextResponse.json({
      ok: true,
      message: "Twitter disconnected successfully",
    });

    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("Error disconnecting Twitter:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect Twitter" },
      { status: 500 },
    );
  }
}
