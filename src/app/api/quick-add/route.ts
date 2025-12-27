import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { quickAddSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";

// POST /api/quick-add - Quick add from mobile shortcuts (bearer token auth)
export async function POST(request: NextRequest) {
  try {
    // Validate bearer token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const ipAddress = getClientIp(request);
    const endpoint = getEndpointId(request);

    if (!token || token !== process.env.QUICK_ADD_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Invalid or missing authorization" },
        { status: 401 },
      );
    }

    // Check rate limit: 30/min and 500/day per token
    const rateLimitResult = await checkRateLimit({
      identifier: `token:${token.slice(0, 8)}`, // Use token prefix as identifier
      endpoint,
      limits: {
        perMinute: 30,
        perDay: 500,
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

    // Parse and validate body
    const body = await request.json();
    const parsed = quickAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // For quick-add, we need to find the default user
    // Since this is a single-user app, get the first user
    const user = await db.user.findFirst();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "No user found. Please sign in to the web app first.",
        },
        { status: 404 },
      );
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

    // Process the item
    const result = await processItem({
      url: parsed.data.url,
      note: parsed.data.note,
      userId: user.id,
    });

    // Add rate limit headers to success response
    const response = NextResponse.json({
      ok: true,
      itemId: result.item.id,
      title: result.item.title,
      source: result.item.source,
      newBadges: result.newBadges,
    });

    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("POST /api/quick-add error:", error);

    // Return user-friendly error message from pipeline validation
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process this URL. Please check the URL and try again.";

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 400 }, // Use 400 for validation errors, not 500
    );
  }
}
