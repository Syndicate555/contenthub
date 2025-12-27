import { db } from "@/lib/db";

export type RateLimitWindow = "minute" | "hour" | "day";

export type RateLimitConfig = {
  identifier: string; // userId, IP, or token
  endpoint: string; // "POST:/api/items"
  limits: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number; // Seconds until reset (if blocked)
};

/**
 * Check and increment rate limit for a given identifier and endpoint
 * Returns success=false if limit exceeded
 */
export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { identifier, endpoint, limits, metadata } = config;

  // Check each configured window (minute, hour, day) in order of strictness
  const windows: Array<{ window: RateLimitWindow; limit: number }> = [];
  if (limits.perMinute)
    windows.push({ window: "minute", limit: limits.perMinute });
  if (limits.perHour) windows.push({ window: "hour", limit: limits.perHour });
  if (limits.perDay) windows.push({ window: "day", limit: limits.perDay });

  for (const { window, limit } of windows) {
    const result = await checkWindow(
      identifier,
      endpoint,
      window,
      limit,
      metadata,
    );

    if (!result.success) {
      // Hit rate limit - return immediately
      return result;
    }
  }

  // All windows passed - return the most restrictive remaining count
  const minuteResult = limits.perMinute
    ? await getWindowStatus(identifier, endpoint, "minute", limits.perMinute)
    : null;

  return (
    minuteResult || {
      success: true,
      limit: limits.perDay || limits.perHour || limits.perMinute || 0,
      remaining: limits.perDay || limits.perHour || limits.perMinute || 0,
      reset: getWindowEnd("day"),
    }
  );
}

/**
 * Check a single time window and increment if under limit
 */
async function checkWindow(
  identifier: string,
  endpoint: string,
  window: RateLimitWindow,
  limit: number,
  metadata?: { ipAddress?: string; userAgent?: string },
): Promise<RateLimitResult> {
  const windowStart = getWindowStart(window);
  const windowEnd = getWindowEnd(window);

  // Use Prisma transaction to atomically check and increment
  const { record, wasAllowed } = await db.$transaction(async (tx) => {
    // Find or create rate limit record
    let rateLimitRecord = await tx.rateLimit.findUnique({
      where: {
        identifier_endpoint_window_windowStart: {
          identifier,
          endpoint,
          window,
          windowStart,
        },
      },
    });

    if (!rateLimitRecord) {
      // Create new record
      rateLimitRecord = await tx.rateLimit.create({
        data: {
          identifier,
          endpoint,
          window,
          windowStart,
          count: 1,
          lastRequestAt: new Date(),
          lastIpAddress: metadata?.ipAddress,
          lastUserAgent: metadata?.userAgent,
        },
      });

      return { record: rateLimitRecord, wasAllowed: true };
    }

    // Check if limit would be exceeded AFTER incrementing
    const wouldExceed = rateLimitRecord.count + 1 > limit;

    if (wouldExceed) {
      // Would exceed limit - do not increment, just return current state
      return { record: rateLimitRecord, wasAllowed: false };
    }

    // Increment count (will be at or under limit after increment)
    const updated = await tx.rateLimit.update({
      where: { id: rateLimitRecord.id },
      data: {
        count: { increment: 1 },
        lastRequestAt: new Date(),
        lastIpAddress: metadata?.ipAddress,
        lastUserAgent: metadata?.userAgent,
      },
    });

    return { record: updated, wasAllowed: true };
  });

  const success = wasAllowed;
  const remaining = Math.max(0, limit - record.count);
  const retryAfter = success
    ? undefined
    : Math.ceil((windowEnd.getTime() - Date.now()) / 1000);

  return {
    success,
    limit,
    remaining,
    reset: windowEnd,
    retryAfter,
  };
}

/**
 * Get current status for a window without incrementing
 */
async function getWindowStatus(
  identifier: string,
  endpoint: string,
  window: RateLimitWindow,
  limit: number,
): Promise<RateLimitResult> {
  const windowStart = getWindowStart(window);
  const windowEnd = getWindowEnd(window);

  const record = await db.rateLimit.findUnique({
    where: {
      identifier_endpoint_window_windowStart: {
        identifier,
        endpoint,
        window,
        windowStart,
      },
    },
  });

  const count = record?.count || 0;
  const remaining = Math.max(0, limit - count);

  return {
    success: count <= limit,
    limit,
    remaining,
    reset: windowEnd,
  };
}

/**
 * Get the start of the current time window (rounded down)
 */
function getWindowStart(window: RateLimitWindow): Date {
  const now = new Date();

  switch (window) {
    case "minute":
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        0,
        0,
      );
    case "hour":
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        0,
        0,
        0,
      );
    case "day":
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
  }
}

/**
 * Get the end of the current time window
 */
function getWindowEnd(window: RateLimitWindow): Date {
  const start = getWindowStart(window);

  switch (window) {
    case "minute":
      return new Date(start.getTime() + 60 * 1000);
    case "hour":
      return new Date(start.getTime() + 60 * 60 * 1000);
    case "day":
      return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Cleanup old rate limit records (run via cron or on app startup)
 * Removes records older than 7 days
 */
export async function cleanupOldRateLimits(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await db.rateLimit.deleteMany({
    where: {
      windowStart: {
        lt: sevenDaysAgo,
      },
    },
  });

  return result.count;
}
