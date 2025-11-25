import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache, cacheKeys } from "@/lib/cache";

// GET /api/domains - Get all available domains
// This endpoint is public (domains are global, not user-specific)
export async function GET() {
  try {
    // Use in-memory cache with 1 hour TTL (domains rarely change)
    const domains = await cache.wrap(
      cacheKeys.domains(),
      async () => {
        return db.domain.findMany({
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true,
            order: true,
          },
        });
      },
      3600 // 1 hour TTL
    );

    // Cache domains since they rarely change
    const response = NextResponse.json({
      ok: true,
      data: { domains },
    });

    // Cache for 1 hour since domains rarely change
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );

    return response;
  } catch (error) {
    console.error("GET /api/domains error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}
