import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";
import { checkRateLimit } from "./rate-limit";

/**
 * Extract client IP address from request headers
 * Vercel provides x-forwarded-for, x-real-ip
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  response.headers.set("RateLimit-Limit", result.limit.toString());
  response.headers.set("RateLimit-Remaining", result.remaining.toString());
  response.headers.set(
    "RateLimit-Reset",
    Math.floor(result.reset.getTime() / 1000).toString(),
  );

  if (result.retryAfter !== undefined) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }

  return response;
}

/**
 * Create 429 rate limit exceeded response with headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      ok: false,
      error: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
    },
    { status: 429 },
  );

  return addRateLimitHeaders(response, result);
}

/**
 * Log suspicious activity to audit trail when rate limits are hit
 */
export async function logRateLimitViolation(
  userId: string | null,
  ipAddress: string,
  endpoint: string,
  userAgent: string | null,
): Promise<void> {
  try {
    // For now, use console.warn until AuditLog table is added
    console.warn("[RATE_LIMIT_VIOLATION]", {
      userId: userId || "anonymous",
      ipAddress,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with AuditLog creation when implemented in Step 7
    // await db.auditLog.create({
    //   data: {
    //     userId,
    //     action: 'rate_limit_exceeded',
    //     resource: endpoint,
    //     metadata: { ipAddress, userAgent },
    //     success: false,
    //   },
    // });
  } catch (error) {
    console.error("Failed to log rate limit violation:", error);
  }
}

/**
 * Get endpoint identifier for rate limiting
 * Format: "METHOD:/api/path"
 */
export function getEndpointId(request: NextRequest): string {
  const url = new URL(request.url);
  return `${request.method}:${url.pathname}`;
}

/**
 * Apply standard rate limits based on endpoint type
 * Returns { response, rateLimitResult } where response is NextResponse with 429 if rate limited, null otherwise
 */
export async function applyStandardRateLimit(
  request: NextRequest,
  userId: string | null,
  type: "read" | "write" | "public" = "read",
  customLimits?: { perMinute?: number; perHour?: number; perDay?: number },
): Promise<{
  response: NextResponse | null;
  rateLimitResult: RateLimitResult;
}> {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  const defaultLimits = {
    read: { perMinute: 100, perDay: 5000 },
    write: { perMinute: 50, perDay: 1000 },
    public: { perMinute: 100 },
  }[type];

  const limits = customLimits || defaultLimits;

  const result = await checkRateLimit({
    identifier: userId || ipAddress,
    endpoint,
    limits,
    metadata: {
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    },
  });

  if (!result.success) {
    await logRateLimitViolation(
      userId,
      ipAddress,
      endpoint,
      request.headers.get("user-agent"),
    );
    return {
      response: createRateLimitResponse(result),
      rateLimitResult: result,
    };
  }

  return { response: null, rateLimitResult: result };
}
