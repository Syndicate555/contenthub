/**
 * Social Connections API
 * GET /api/connections - List all connections
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get all connections for the user
    const connections = await prisma.socialConnection.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        providerHandle: true,
        syncEnabled: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    // Get import counts for each provider
    const importCounts = await prisma.item.groupBy({
      by: ["importSource"],
      where: {
        userId: user.id,
        importSource: { not: null },
      },
      _count: true,
    });

    const countMap = new Map<string | null, number>(
      importCounts.map((c: { importSource: string | null; _count: number }) => [c.importSource, c._count])
    );

    // Enrich connections with import counts
    const enrichedConnections = connections.map((conn: { id: string; provider: string; providerHandle: string | null; syncEnabled: boolean; lastSyncAt: Date | null; createdAt: Date }) => ({
      ...conn,
      importedCount: countMap.get(conn.provider) || 0,
    }));

    return NextResponse.json({
      ok: true,
      data: enrichedConnections,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
