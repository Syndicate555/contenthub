import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";

// Validation schema for setting focus areas
const SetFocusAreasSchema = z.object({
  domainIds: z
    .array(z.string())
    .min(1, "Select at least 1 focus area")
    .max(3, "Maximum 3 focus areas allowed"),
});

// GET /api/user/focus-areas - Get user's current focus areas
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's focus areas with domain details
    const focusAreas = await db.focusArea.findMany({
      where: { userId: user.id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          focusAreas: focusAreas.map((fa) => ({
            id: fa.id,
            priority: fa.priority,
            domain: fa.domain,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/user/focus-areas error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch focus areas" },
      { status: 500 },
    );
  }
}

// POST /api/user/focus-areas - Set user's focus areas (replaces existing)
export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check rate limit: 30/day per user
    const rateLimitResult = await checkRateLimit({
      identifier: user.id,
      endpoint,
      limits: {
        perDay: 30,
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

    // Prevent writes in demo mode
    try {
      const { assertNotDemoUser } = await import("@/lib/auth");
      await assertNotDemoUser(user);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Demo mode is read-only. Sign in to save changes.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = SetFocusAreasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { domainIds } = parsed.data;

    // Verify all domain IDs exist
    const domains = await db.domain.findMany({
      where: { id: { in: domainIds } },
      select: { id: true },
    });

    if (domains.length !== domainIds.length) {
      return NextResponse.json(
        { ok: false, error: "One or more invalid domain IDs" },
        { status: 400 },
      );
    }

    // Delete existing focus areas and create new ones in a transaction
    await db.$transaction(async (tx) => {
      // Delete all existing focus areas for this user
      await tx.focusArea.deleteMany({
        where: { userId: user.id },
      });

      // Create new focus areas with priority based on order
      await tx.focusArea.createMany({
        data: domainIds.map((domainId, index) => ({
          userId: user.id,
          domainId,
          priority: index + 1, // 1, 2, 3
        })),
      });
    });

    // Fetch the newly created focus areas
    const focusAreas = await db.focusArea.findMany({
      where: { userId: user.id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        focusAreas: focusAreas.map((fa) => ({
          id: fa.id,
          priority: fa.priority,
          domain: fa.domain,
        })),
      },
    });

    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("POST /api/user/focus-areas error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to set focus areas" },
      { status: 500 },
    );
  }
}
