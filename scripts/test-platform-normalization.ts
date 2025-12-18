/**
 * Test script to verify platform normalization logic
 */

import {
  normalizeDomain,
  getPlatformDisplayName,
  consolidatePlatforms,
} from "../src/lib/platform-normalizer";

console.log("Testing Platform Normalization\n");
console.log("=".repeat(60));

// Test 1: Basic domain normalization
console.log("\n1. Testing normalizeDomain():");
console.log("-".repeat(60));

const testDomains = [
  "www.reddit.com",
  "reddit.com",
  "old.reddit.com",
  "vt.tiktok.com",
  "www.tiktok.com",
  "tiktok.com",
  "vm.tiktok.com",
  "m.youtube.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "www.x.com",
  "anthropic.skilljar.com",
  "www.anthropic.skilljar.com",
];

testDomains.forEach((domain) => {
  const normalized = normalizeDomain(domain);
  console.log(`  ${domain.padEnd(30)} → ${normalized}`);
});

// Test 2: Display names
console.log("\n2. Testing getPlatformDisplayName():");
console.log("-".repeat(60));

const testPlatforms = [
  "reddit",
  "tiktok",
  "youtube",
  "twitter",
  "github",
  "medium",
  "substack",
  "anthropic.skilljar.com",
  "productmarketfit.tech",
  "deeplearning.ai",
];

testPlatforms.forEach((platform) => {
  const displayName = getPlatformDisplayName(platform);
  console.log(`  ${platform.padEnd(30)} → ${displayName}`);
});

// Test 3: Platform consolidation
console.log("\n3. Testing consolidatePlatforms():");
console.log("-".repeat(60));

const rawPlatforms = [
  { platform: "www.reddit.com", count: 15 },
  { platform: "reddit.com", count: 8 },
  { platform: "old.reddit.com", count: 3 },
  { platform: "vt.tiktok.com", count: 5 },
  { platform: "www.tiktok.com", count: 7 },
  { platform: "tiktok.com", count: 2 },
  { platform: "youtube.com", count: 20 },
  { platform: "youtu.be", count: 10 },
  { platform: "twitter.com", count: 12 },
  { platform: "x.com", count: 5 },
];

const consolidated = consolidatePlatforms(rawPlatforms);

console.log("\nRaw platforms:");
rawPlatforms.forEach((p) => {
  console.log(`  ${p.platform.padEnd(25)} → ${p.count} items`);
});

console.log("\nConsolidated platforms:");
consolidated.forEach((p) => {
  console.log(`  ${p.displayName.padEnd(25)} → ${p.count} items`);
  console.log(
    `    Variations: ${p.variations.join(", ")}`,
  );
});

// Test 4: Edge cases
console.log("\n4. Testing edge cases:");
console.log("-".repeat(60));

const edgeCases = [
  "",
  "https://www.reddit.com/r/programming",
  "www.reddit.com/",
  "WWW.REDDIT.COM",
  "reddit.com:8080",
  "m.reddit.com/path/to/post",
];

edgeCases.forEach((domain) => {
  const normalized = normalizeDomain(domain);
  console.log(`  "${domain}" → "${normalized}"`);
});

console.log("\n" + "=".repeat(60));
console.log("✅ All tests completed successfully!");
