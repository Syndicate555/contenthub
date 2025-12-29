import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";

// Ensure Node.js runtime (jsdom/parse5 are not edge-compatible)
export const runtime = "nodejs";

// Increase function timeout to 60s to handle cold starts
export const maxDuration = 60;

import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { createItemSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";
import { assertNotDemoUser } from "@/lib/auth";

console.log("[API /items/extension] Route module initialized successfully");

/**
 * CORS headers for Chrome extension
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins (extensions use chrome-extension://)
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Helper to add CORS headers to a response
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * OPTIONS /api/items/extension - Handle preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * POST /api/items/extension - Create item via Chrome extension
 * Uses Bearer token authentication instead of Clerk session cookies
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  console.log("[API /items/extension POST] Request received");

  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "Missing or invalid authorization header",
          },
          { status: 401 },
        ),
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token with Clerk
    let clerkPayload;
    try {
      clerkPayload = await verifyToken(token, {
        // Use Clerk secret key for verification
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
    } catch (error) {
      console.error("[API /items/extension] Token verification failed:", error);
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "Invalid or expired token",
          },
          { status: 401 },
        ),
      );
    }

    if (!clerkPayload || !clerkPayload.sub) {
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "Invalid token payload",
          },
          { status: 401 },
        ),
      );
    }

    const clerkId = clerkPayload.sub;

    console.log(
      `[API /items/extension POST] Token verified in ${Date.now() - startTime}ms for user ${clerkId}`,
    );

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error:
              "User not found. Please sign in to the web app first to create your account.",
          },
          { status: 404 },
        ),
      );
    }

    // Check rate limit: 30/min and 200/day per user (same as web app)
    const rateLimitResult = await checkRateLimit({
      identifier: user.id,
      endpoint,
      limits: {
        perMinute: 30,
        perDay: 200,
      },
      metadata: {
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
        source: "extension",
      },
    });

    if (!rateLimitResult.success) {
      await logRateLimitViolation(
        user.id,
        ipAddress,
        endpoint,
        request.headers.get("user-agent"),
      );
      return addCorsHeaders(createRateLimitResponse(rateLimitResult));
    }

    // Prevent writes in demo mode
    try {
      await assertNotDemoUser(user);
    } catch (error) {
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Demo mode is read-only. Sign in to save changes.",
          },
          { status: 403 },
        ),
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return addCorsHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "Invalid input",
            details: parsed.error.flatten(),
          },
          { status: 400 },
        ),
      );
    }

    console.log(
      `[API /items/extension POST] Processing item: ${parsed.data.url}`,
    );

    // Process the item using existing pipeline
    const result = await processItem({
      url: parsed.data.url,
      note: parsed.data.note,
      userId: user.id,
      preExtractedData: body.preExtractedData,
    });

    console.log(
      `[API /items/extension POST] Item processed successfully in ${Date.now() - startTime}ms`,
    );

    // Add rate limit headers to success response
    const response = NextResponse.json(
      {
        ok: true,
        data: result.item,
        newBadges: result.newBadges,
      },
      { status: 201 },
    );

    return addCorsHeaders(addRateLimitHeaders(response, rateLimitResult));
  } catch (error) {
    console.error("[API /items/extension POST] Error:", error);

    return addCorsHeaders(
      NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Failed to create item",
        },
        { status: 500 },
      ),
    );
  }
}
