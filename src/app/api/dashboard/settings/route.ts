import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/settings
 * Batch endpoint that returns all data needed for the Settings page in one request
 * Combines: social connections and focus areas
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch connections, focus areas, and import counts in parallel
    const [connections, focusAreas, importCounts] = await Promise.all([
      db.socialConnection.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          provider: true,
          providerHandle: true,
          lastSyncAt: true,
          syncEnabled: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.focusArea.findMany({
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
      }),
      db.item.groupBy({
        by: ["importSource"],
        where: {
          userId: user.id,
          importSource: { not: null },
        },
        _count: true,
      }),
    ]);

    // Create import count map
    const countMap = new Map<string, number>(
      importCounts.map((c) => [c.importSource!, c._count])
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          connections: connections.map((c) => ({
            id: c.id,
            provider: c.provider,
            providerHandle: c.providerHandle,
            handle: c.providerHandle,
            lastSyncAt: c.lastSyncAt,
            syncEnabled: c.syncEnabled,
            connectedAt: c.createdAt,
            createdAt: c.createdAt,
            importedCount: countMap.get(c.provider) || 0,
          })),
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
      }
    );
  } catch (error) {
    console.error("GET /api/dashboard/settings error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch settings data" },
      { status: 500 }
    );
  }
}
