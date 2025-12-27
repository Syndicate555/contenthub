import { db } from "./db";

/**
 * Audit Log Query Utilities
 * Helper functions for querying security events and user activity
 */

/**
 * Get recent rate limit violations
 * Useful for monitoring abuse patterns
 */
export async function getRecentRateLimitViolations(limit = 100, hoursAgo = 24) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return db.auditLog.findMany({
    where: {
      action: "rate_limit_exceeded",
      createdAt: { gte: since },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get top offenders by rate limit violations
 * Identifies users or IPs hitting rate limits repeatedly
 */
export async function getTopRateLimitOffenders(limit = 20, hoursAgo = 24) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const violations = await db.auditLog.groupBy({
    by: ["userId"],
    where: {
      action: "rate_limit_exceeded",
      createdAt: { gte: since },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  // Enrich with user details
  const userIds = violations
    .map((v) => v.userId)
    .filter((id): id is string => id !== null);

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return violations.map((v) => ({
    userId: v.userId,
    user: v.userId ? userMap.get(v.userId) : null,
    violationCount: v._count.id,
  }));
}

/**
 * Get violations by endpoint
 * Shows which endpoints are being hit most frequently
 */
export async function getViolationsByEndpoint(limit = 20, hoursAgo = 24) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return db.auditLog.groupBy({
    by: ["resource"],
    where: {
      action: "rate_limit_exceeded",
      createdAt: { gte: since },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
}

/**
 * Get violations by IP address
 * Identifies suspicious IPs attacking multiple endpoints
 */
export async function getViolationsByIP(limit = 20, hoursAgo = 24) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const logs = await db.auditLog.findMany({
    where: {
      action: "rate_limit_exceeded",
      createdAt: { gte: since },
    },
    select: {
      metadata: true,
    },
  });

  // Extract IP addresses from metadata and count occurrences
  const ipCounts = new Map<string, number>();

  for (const log of logs) {
    const metadata = log.metadata as { ipAddress?: string } | null;
    const ip = metadata?.ipAddress;
    if (ip) {
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    }
  }

  // Sort by count and return top offenders
  return Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ipAddress: ip, violationCount: count }))
    .sort((a, b) => b.violationCount - a.violationCount)
    .slice(0, limit);
}

/**
 * Get user's audit log history
 * Shows all security events for a specific user
 */
export async function getUserAuditLog(
  userId: string,
  limit = 50,
  daysAgo = 30,
) {
  const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return db.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Cleanup old audit logs
 * Remove logs older than specified days (default: 90 days for compliance)
 */
export async function cleanupOldAuditLogs(daysToKeep = 90): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await db.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Get audit log statistics
 * Summary of recent activity for dashboards
 */
export async function getAuditLogStats(hoursAgo = 24) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const [totalEvents, rateLimitViolations, uniqueUsers, uniqueIPs] =
    await Promise.all([
      // Total events
      db.auditLog.count({
        where: { createdAt: { gte: since } },
      }),

      // Rate limit violations
      db.auditLog.count({
        where: {
          action: "rate_limit_exceeded",
          createdAt: { gte: since },
        },
      }),

      // Unique users
      db.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),

      // Extract unique IPs from metadata
      db.auditLog.findMany({
        where: { createdAt: { gte: since } },
        select: { metadata: true },
      }),
    ]);

  // Count unique IPs from metadata
  const ipSet = new Set<string>();
  for (const log of uniqueIPs) {
    const metadata = log.metadata as { ipAddress?: string } | null;
    if (metadata?.ipAddress) {
      ipSet.add(metadata.ipAddress);
    }
  }

  return {
    totalEvents,
    rateLimitViolations,
    uniqueUsers: uniqueUsers.length,
    uniqueIPs: ipSet.size,
    timeWindow: `${hoursAgo} hours`,
  };
}
