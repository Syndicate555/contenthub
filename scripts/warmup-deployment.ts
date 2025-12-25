#!/usr/bin/env tsx

/**
 * Deployment Warmup Script
 *
 * Warms up serverless functions after deployment by calling the health check endpoint.
 * This pre-initializes database connections, modules, and route handlers to avoid
 * cold start issues on first user request.
 *
 * Usage:
 *   DEPLOYMENT_URL=https://your-app.vercel.app npm run warmup
 *
 * Or add to Vercel deploy hook:
 *   vercel deploy --prod && npm run warmup
 */

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || process.env.VERCEL_URL;
const HEALTH_ENDPOINT = "/api/health";

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  duration: number;
  checks: Record<
    string,
    {
      status: "ok" | "error";
      duration?: number;
      error?: string;
    }
  >;
  environment?: {
    nodeVersion: string;
    platform: string;
    runtime: string;
  };
}

async function warmupDeployment() {
  if (!DEPLOYMENT_URL) {
    console.error(
      "❌ DEPLOYMENT_URL environment variable is not set. Please set it to your deployment URL."
    );
    console.error("   Example: DEPLOYMENT_URL=https://your-app.vercel.app npm run warmup");
    process.exit(1);
  }

  const url = DEPLOYMENT_URL.startsWith("http")
    ? DEPLOYMENT_URL
    : `https://${DEPLOYMENT_URL}`;
  const healthUrl = `${url}${HEALTH_ENDPOINT}`;

  console.log("🚀 Starting deployment warmup...");
  console.log(`   Target: ${healthUrl}`);
  console.log("");

  const startTime = Date.now();

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ContentHub-Warmup-Script/1.0",
      },
    });

    const duration = Date.now() - startTime;
    const data: HealthCheckResponse = await response.json();

    console.log(`⏱️  Health check completed in ${duration}ms`);
    console.log("");

    if (response.ok && data.status === "healthy") {
      console.log("✅ All systems healthy!");
      console.log("");
      console.log("Check results:");
      for (const [checkName, checkResult] of Object.entries(data.checks)) {
        const icon = checkResult.status === "ok" ? "✅" : "❌";
        const timing = checkResult.duration ? ` (${checkResult.duration}ms)` : "";
        console.log(`   ${icon} ${checkName}${timing}`);
        if (checkResult.error) {
          console.log(`      Error: ${checkResult.error}`);
        }
      }

      if (data.environment) {
        console.log("");
        console.log("Environment:");
        console.log(`   Node: ${data.environment.nodeVersion}`);
        console.log(`   Platform: ${data.environment.platform}`);
        console.log(`   Runtime: ${data.environment.runtime}`);
      }

      console.log("");
      console.log("🎉 Deployment is warmed up and ready for users!");
      process.exit(0);
    } else {
      console.log(`⚠️  Health check returned status: ${data.status}`);
      console.log("");
      console.log("Check results:");
      for (const [checkName, checkResult] of Object.entries(data.checks)) {
        const icon = checkResult.status === "ok" ? "✅" : "❌";
        const timing = checkResult.duration ? ` (${checkResult.duration}ms)` : "";
        console.log(`   ${icon} ${checkName}${timing}`);
        if (checkResult.error) {
          console.log(`      Error: ${checkResult.error}`);
        }
      }

      console.log("");
      console.log("⚠️  Some systems are degraded. Check logs for details.");
      process.exit(1);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Health check failed after ${duration}ms`);
    console.error("");
    console.error("Error details:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.cause) {
        console.error(`   Cause: ${error.cause}`);
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    console.error("");
    console.error("💡 Troubleshooting:");
    console.error("   1. Verify the deployment URL is correct");
    console.error("   2. Check if the deployment has finished");
    console.error("   3. Verify the /api/health endpoint is accessible");
    console.error("   4. Check Vercel logs for errors");
    process.exit(1);
  }
}

warmupDeployment();
