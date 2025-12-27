#!/usr/bin/env tsx
/**
 * Core Rate Limiting Logic Test (Database Level)
 * Tests the rate limiting functions directly without HTTP
 */

import { checkRateLimit, cleanupOldRateLimits } from "../src/lib/rate-limit";
import { db } from "../src/lib/db";

async function runTests() {
  console.log("\n🧪 Testing Core Rate Limiting Logic\n");

  try {
    // Cleanup any existing test data first
    console.log("Cleaning up any existing test data...");
    await db.rateLimit.deleteMany({
      where: {
        identifier: {
          startsWith: "test-user-",
        },
      },
    });
    console.log("✅ Cleanup complete\n");

    // Run requests rapidly in sequence to stay within same minute window
    console.log("Running 4 rapid requests (limit: 3)...\n");

    const results = [];
    for (let i = 1; i <= 4; i++) {
      const start = Date.now();
      const result = await checkRateLimit({
        identifier: "test-user-123",
        endpoint: "POST:/api/test",
        limits: {
          perMinute: 3,
        },
        metadata: {
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
        },
      });
      const duration = Date.now() - start;

      results.push(result);

      console.log(`Request ${i}:`);
      console.log(`  Success: ${result.success ? "✅" : "❌"}`);
      console.log(`  Limit: ${result.limit}, Remaining: ${result.remaining}`);
      console.log(`  Retry After: ${result.retryAfter || "N/A"}`);
      console.log(`  Duration: ${duration}ms\n`);
    }

    // Validate results
    if (!results[0].success) {
      console.error("❌ FAIL: Request 1 should succeed");
      process.exit(1);
    }
    if (!results[1].success) {
      console.error("❌ FAIL: Request 2 should succeed");
      process.exit(1);
    }
    if (!results[2].success) {
      console.error("❌ FAIL: Request 3 should succeed");
      process.exit(1);
    }
    if (results[3].success) {
      console.error("❌ FAIL: Request 4 should be blocked");
      process.exit(1);
    }

    console.log("✅ All sequential requests passed!\n");

    // Test 5: Check database state
    console.log("\nTest 5: Checking database state...");
    const rateLimits = await db.rateLimit.findMany({
      where: {
        identifier: "test-user-123",
        endpoint: "POST:/api/test",
      },
    });

    console.log(`✅ Found ${rateLimits.length} rate limit record(s)`);
    rateLimits.forEach((record) => {
      console.log(`   - Window: ${record.window}, Count: ${record.count}/3`);
      console.log(`     Window Start: ${record.windowStart.toISOString()}`);
      console.log(`     Last Request: ${record.lastRequestAt.toISOString()}`);
      console.log(`     IP: ${record.lastIpAddress}`);
    });

    // Test 6: Multi-window enforcement
    console.log("\nTest 6: Testing multi-window enforcement...");
    const multiResult1 = await checkRateLimit({
      identifier: "test-user-multi",
      endpoint: "POST:/api/multi",
      limits: {
        perMinute: 5,
        perHour: 10,
        perDay: 20,
      },
    });

    console.log(`✅ Multi-window first request:`, {
      success: multiResult1.success,
      limit: multiResult1.limit,
      remaining: multiResult1.remaining,
    });

    // Test 7: Cleanup function
    console.log("\nTest 7: Testing cleanup function...");
    const deletedCount = await cleanupOldRateLimits();
    console.log(`✅ Cleaned up ${deletedCount} old records`);

    // Cleanup test data
    console.log("\nCleaning up test data...");
    await db.rateLimit.deleteMany({
      where: {
        identifier: {
          startsWith: "test-user-",
        },
      },
    });
    console.log("✅ Test data cleaned up");

    console.log("\n✅ All core tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
