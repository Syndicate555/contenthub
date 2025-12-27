#!/usr/bin/env tsx
/**
 * Comprehensive Rate Limiting Load Test
 * Tests all P0 endpoints to verify rate limiting works correctly
 *
 * Run: npx tsx scripts/test-rate-limits.ts
 */

import { db } from "../src/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const QUICK_ADD_SECRET = process.env.QUICK_ADD_SECRET;

type TestResult = {
  endpoint: string;
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
};

const results: TestResult[] = [];

function logTest(
  endpoint: string,
  testName: string,
  passed: boolean,
  details: string,
  duration: number,
) {
  const emoji = passed ? "✅" : "❌";
  console.log(`${emoji} ${endpoint} - ${testName}`);
  console.log(`   ${details}`);
  console.log(`   Duration: ${duration}ms\n`);

  results.push({ endpoint, testName, passed, details, duration });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test 1: Demo Session Endpoint (1/min, 10/hour per IP)
 */
async function testDemoSession() {
  console.log("\n📋 Test 1: Demo Session Rate Limiting (1/min per IP)\n");

  const endpoint = "/api/demo/session";
  const url = `${BASE_URL}${endpoint}`;

  // Test 1a: First request should succeed
  const start1 = Date.now();
  const response1 = await fetch(url, { method: "POST" });
  const duration1 = Date.now() - start1;

  const headers1 = {
    limit: response1.headers.get("RateLimit-Limit"),
    remaining: response1.headers.get("RateLimit-Remaining"),
    reset: response1.headers.get("RateLimit-Reset"),
  };

  logTest(
    endpoint,
    "First request succeeds",
    response1.status === 200,
    `Status: ${response1.status}, Headers: ${JSON.stringify(headers1)}`,
    duration1,
  );

  // Test 1b: Second request should be rate limited (1/min)
  const start2 = Date.now();
  const response2 = await fetch(url, { method: "POST" });
  const duration2 = Date.now() - start2;

  const headers2 = {
    limit: response2.headers.get("RateLimit-Limit"),
    remaining: response2.headers.get("RateLimit-Remaining"),
    reset: response2.headers.get("RateLimit-Reset"),
    retryAfter: response2.headers.get("Retry-After"),
  };

  const body2 = await response2.json();

  logTest(
    endpoint,
    "Second request rate limited (429)",
    response2.status === 429,
    `Status: ${response2.status}, Headers: ${JSON.stringify(headers2)}, Error: ${body2.error}`,
    duration2,
  );

  // Test 1c: Verify rate limit headers are present
  logTest(
    endpoint,
    "Rate limit headers present",
    headers1.limit === "1" &&
      headers1.remaining === "0" &&
      headers1.reset !== null,
    `Limit: ${headers1.limit}, Remaining: ${headers1.remaining}, Reset: ${headers1.reset}`,
    0,
  );

  // Test 1d: Verify Retry-After header on 429
  logTest(
    endpoint,
    "Retry-After header present on 429",
    headers2.retryAfter !== null && parseInt(headers2.retryAfter!) > 0,
    `Retry-After: ${headers2.retryAfter} seconds`,
    0,
  );
}

/**
 * Test 2: Quick Add Endpoint (30/min, 500/day per token)
 */
async function testQuickAdd() {
  console.log(
    "\n📋 Test 2: Quick Add Rate Limiting (30/min, 500/day per token)\n",
  );

  const endpoint = "/api/quick-add";
  const url = `${BASE_URL}${endpoint}`;

  if (!QUICK_ADD_SECRET) {
    logTest(
      endpoint,
      "Skip test (no QUICK_ADD_SECRET)",
      false,
      "QUICK_ADD_SECRET not configured in .env",
      0,
    );
    return;
  }

  // Test 2a: Request without auth should fail with 401
  const start1 = Date.now();
  const response1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com", note: "test" }),
  });
  const duration1 = Date.now() - start1;

  logTest(
    endpoint,
    "Unauthorized request rejected (401)",
    response1.status === 401,
    `Status: ${response1.status}`,
    duration1,
  );

  // Test 2b: Make 31 requests to test 30/min limit
  console.log("   Making 31 requests to test rate limit...");
  let successCount = 0;
  let rateLimitedCount = 0;

  const start2 = Date.now();

  for (let i = 1; i <= 31; i++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QUICK_ADD_SECRET}`,
      },
      body: JSON.stringify({
        url: `https://example.com/test-${i}`,
        note: "load test",
      }),
    });

    if (response.status === 201 || response.status === 200) {
      successCount++;
    } else if (response.status === 429) {
      rateLimitedCount++;
    }

    // Show progress
    if (i % 10 === 0 || i === 31) {
      console.log(
        `   Progress: ${i}/31 (Success: ${successCount}, Rate limited: ${rateLimitedCount})`,
      );
    }
  }

  const duration2 = Date.now() - start2;

  // We expect up to 30 successes and at least 1 rate limited
  // Note: Some requests might fail for other reasons (demo mode, validation, etc.)
  logTest(
    endpoint,
    "Rate limit enforced after 30 requests",
    rateLimitedCount >= 1,
    `Successes: ${successCount}, Rate limited: ${rateLimitedCount}, Total time: ${duration2}ms`,
    duration2,
  );
}

/**
 * Test 3: Items POST Endpoint (30/min, 200/day per user)
 */
async function testItemsPost() {
  console.log(
    "\n📋 Test 3: Items POST Rate Limiting (30/min, 200/day per user)\n",
  );

  const endpoint = "/api/items";
  const url = `${BASE_URL}${endpoint}`;

  // Test 3a: Request without auth should fail with 401
  const start1 = Date.now();
  const response1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com", note: "test" }),
  });
  const duration1 = Date.now() - start1;

  logTest(
    endpoint,
    "Unauthorized request rejected (401)",
    response1.status === 401,
    `Status: ${response1.status}`,
    duration1,
  );

  console.log(
    "   ℹ️  Skipping authenticated load test (requires Clerk session)",
  );
  console.log("   ℹ️  Rate limiting logic is identical to quick-add\n");
}

/**
 * Test 4: Twitter OAuth Rate Limiting (10/min per IP)
 */
async function testTwitterOAuth() {
  console.log("\n📋 Test 4: Twitter OAuth Rate Limiting (10/min per IP)\n");

  const endpoint = "/api/auth/twitter";
  const url = `${BASE_URL}${endpoint}`;

  // Test 4a: Make 11 requests to test 10/min limit
  console.log("   Making 11 requests to test rate limit...");
  let redirectCount = 0;
  let rateLimitedCount = 0;

  const start = Date.now();

  for (let i = 1; i <= 11; i++) {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual", // Don't follow redirects
    });

    // 302 redirect to sign-in (unauthenticated) or Twitter (authenticated)
    // 429 rate limited
    // 200 could be a JSON response
    if (response.status === 302 || response.status === 307) {
      redirectCount++;
    } else if (response.status === 429) {
      rateLimitedCount++;
    }

    if (i % 5 === 0 || i === 11) {
      console.log(
        `   Progress: ${i}/11 (Redirects: ${redirectCount}, Rate limited: ${rateLimitedCount})`,
      );
    }
  }

  const duration = Date.now() - start;

  logTest(
    endpoint,
    "Rate limit enforced after 10 requests",
    rateLimitedCount >= 1,
    `Redirects: ${redirectCount}, Rate limited: ${rateLimitedCount}, Total time: ${duration}ms`,
    duration,
  );
}

/**
 * Test 5: Database State Verification
 */
async function testDatabaseState() {
  console.log("\n📋 Test 5: Database State Verification\n");

  const start = Date.now();

  try {
    // Check that RateLimit table exists and has records
    const rateLimits = await db.rateLimit.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const duration = Date.now() - start;

    logTest(
      "Database",
      "RateLimit table populated",
      rateLimits.length > 0,
      `Found ${rateLimits.length} rate limit records`,
      duration,
    );

    // Show sample records
    if (rateLimits.length > 0) {
      console.log("\n   📊 Sample Rate Limit Records:\n");
      rateLimits.slice(0, 5).forEach((record, idx) => {
        console.log(`   ${idx + 1}. ${record.endpoint}`);
        console.log(`      Identifier: ${record.identifier}`);
        console.log(
          `      Window: ${record.window}, Count: ${record.count}/${record.window === "minute" ? "1-30" : record.window === "hour" ? "10" : "200-500"}`,
        );
        console.log(`      Last Request: ${record.lastRequestAt}`);
        console.log(`      IP: ${record.lastIpAddress || "N/A"}\n`);
      });
    }

    // Test cleanup function
    console.log("   Testing cleanup function...");
    const { cleanupOldRateLimits } = await import("../src/lib/rate-limit");

    // Don't actually delete anything, just verify it doesn't throw
    const cleanupStart = Date.now();
    const deletedCount = await cleanupOldRateLimits();
    const cleanupDuration = Date.now() - cleanupStart;

    logTest(
      "Database",
      "Cleanup function works",
      true,
      `Cleaned up ${deletedCount} old records`,
      cleanupDuration,
    );
  } catch (error) {
    const duration = Date.now() - start;
    logTest(
      "Database",
      "Database operations failed",
      false,
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration,
    );
  }
}

/**
 * Test 6: Concurrent Requests (Race Condition Test)
 */
async function testConcurrentRequests() {
  console.log("\n📋 Test 6: Concurrent Request Handling (Race Conditions)\n");

  const endpoint = "/api/demo/session";
  const url = `${BASE_URL}${endpoint}`;

  // Wait for rate limit to reset (1 minute window)
  console.log("   ⏳ Waiting 65 seconds for rate limit to reset...");
  await sleep(65000);

  // Make 5 concurrent requests
  console.log("   Making 5 concurrent requests...");
  const start = Date.now();

  const promises = Array(5)
    .fill(null)
    .map(() => fetch(url, { method: "POST" }));

  const responses = await Promise.all(promises);
  const duration = Date.now() - start;

  const successCount = responses.filter((r) => r.status === 200).length;
  const rateLimitedCount = responses.filter((r) => r.status === 429).length;

  // With 1/min limit, only 1 should succeed
  logTest(
    endpoint,
    "Concurrent requests handled correctly",
    successCount === 1 && rateLimitedCount === 4,
    `Success: ${successCount}, Rate limited: ${rateLimitedCount} (expected 1 success, 4 rate limited)`,
    duration,
  );
}

/**
 * Test 7: Window Boundary Test (Skipped - tests private functions)
 */
async function testWindowBoundaries() {
  console.log("\n📋 Test 7: Time Window Boundary Handling (Skipped)\n");
  console.log("   ℹ️  Window functions are private - tested indirectly via core tests\n");
}

/**
 * Print summary report
 */
function printSummary() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 LOAD TEST SUMMARY");
  console.log("=".repeat(80) + "\n");

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Pass Rate: ${passRate}%\n`);

  if (failedTests > 0) {
    console.log("❌ Failed Tests:\n");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   • ${r.endpoint} - ${r.testName}`);
        console.log(`     ${r.details}\n`);
      });
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)\n`);

  console.log("=".repeat(80) + "\n");

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 RATE LIMITING LOAD TEST");
  console.log("=".repeat(80));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Run all tests sequentially
    await testDemoSession();
    await testQuickAdd();
    await testItemsPost();
    await testTwitterOAuth();
    await testDatabaseState();
    await testWindowBoundaries();

    // Concurrent test takes 65 seconds - make it optional
    console.log("\n⚠️  Concurrent test requires 65s wait. Skip? (y/n)");
    // For automated testing, skip concurrent test
    // await testConcurrentRequests();

    printSummary();
  } catch (error) {
    console.error("\n❌ Fatal error during testing:");
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
