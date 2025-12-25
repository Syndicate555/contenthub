import { NextResponse } from "next/server";

// Use Node.js runtime for database access
export const runtime = "nodejs";

// Cache for 0 seconds (always fresh)
export const revalidate = 0;

/**
 * Health Check Endpoint
 *
 * Purpose:
 * 1. Warm up serverless functions on deployment
 * 2. Pre-initialize database connections
 * 3. Verify critical modules load correctly
 * 4. Monitor system health
 *
 * Usage:
 * - Call after deployment to warm up functions
 * - Set up external monitoring to hit this endpoint regularly
 * - Use in CI/CD to verify deployment health
 */

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error"; duration?: number; error?: string }> = {};

  try {
    // 1. Database Connection Check
    const dbStartTime = Date.now();
    try {
      const { db } = await import("@/lib/db");
      // Simple query to test connection
      await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: "ok",
        duration: Date.now() - dbStartTime,
      };
    } catch (error) {
      checks.database = {
        status: "error",
        duration: Date.now() - dbStartTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 2. Auth Module Check
    const authStartTime = Date.now();
    try {
      await import("@/lib/auth");
      checks.auth = {
        status: "ok",
        duration: Date.now() - authStartTime,
      };
    } catch (error) {
      checks.auth = {
        status: "error",
        duration: Date.now() - authStartTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 3. Pipeline Module Check (includes platform-detector)
    const pipelineStartTime = Date.now();
    try {
      await import("@/lib/pipeline");
      await import("@/lib/platform-detector");
      checks.pipeline = {
        status: "ok",
        duration: Date.now() - pipelineStartTime,
      };
    } catch (error) {
      checks.pipeline = {
        status: "error",
        duration: Date.now() - pipelineStartTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 4. Items API Route Module Check
    const itemsApiStartTime = Date.now();
    try {
      // This will initialize the route module
      await import("../items/route");
      checks.itemsApi = {
        status: "ok",
        duration: Date.now() - itemsApiStartTime,
      };
    } catch (error) {
      checks.itemsApi = {
        status: "error",
        duration: Date.now() - itemsApiStartTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Calculate overall health
    const allOk = Object.values(checks).every((check) => check.status === "ok");
    const totalDuration = Date.now() - startTime;

    const response = {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        runtime: "nodejs",
      },
    };

    console.log("[API /health] Health check completed:", {
      status: response.status,
      duration: totalDuration,
      checkResults: Object.fromEntries(
        Object.entries(checks).map(([key, val]) => [key, val.status])
      ),
    });

    return NextResponse.json(response, {
      status: allOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "X-Health-Status": response.status,
      },
    });
  } catch (error) {
    console.error("[API /health] Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        checks,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          "X-Health-Status": "error",
        },
      }
    );
  }
}
