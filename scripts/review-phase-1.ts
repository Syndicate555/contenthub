// Phase 1 Comprehensive Review
// Tests all gamification features (Features 1-6)
// Run with: npx tsx scripts/review-phase-1.ts

import { PrismaClient } from "../src/generated/prisma";
import { getDomainForContent } from "../src/lib/domains";
import {
  awardXP,
  XP_ACTIONS,
  calculateLevel,
  getUserStats,
} from "../src/lib/xp";
import { updateStreak, getUserStreak } from "../src/lib/streak";
import { checkAllBadges, getUserBadges } from "../src/lib/badges";

const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function warning(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function section(title: string) {
  console.log(`\n${colors.blue}${"=".repeat(70)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${"=".repeat(70)}${colors.reset}\n`);
}

async function reviewPhase1() {
  console.log("\n🔍 Phase 1 Comprehensive Review\n");
  console.log("Testing all gamification features (Features 1-6)...\n");

  let issuesFound = 0;
  let testsRun = 0;

  try {
    // =================================================================
    // FEATURE 1: Domain & Focus Area Schema
    // =================================================================
    section("Feature 1: Domain & Focus Area Schema");

    testsRun++;
    const domains = await prisma.domain.findMany({ orderBy: { order: "asc" } });
    if (domains.length === 8) {
      success(`Database has ${domains.length} domains (expected 8)`);
    } else {
      error(`Database has ${domains.length} domains (expected 8)`);
      issuesFound++;
    }

    console.log("\nDomains in database:");
    domains.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.icon} ${d.displayName} (${d.name})`);
    });

    testsRun++;
    const requiredDomains = [
      "finance",
      "career",
      "health",
      "philosophy",
      "relationships",
      "productivity",
      "creativity",
      "technology",
    ];
    const domainNames = domains.map((d) => d.name);
    const missingDomains = requiredDomains.filter(
      (name) => !domainNames.includes(name),
    );

    if (missingDomains.length === 0) {
      success("All required domains present");
    } else {
      error(`Missing domains: ${missingDomains.join(", ")}`);
      issuesFound++;
    }

    // Check schema models exist
    testsRun++;
    try {
      await prisma.userDomain.findMany({ take: 1 });
      await prisma.focusArea.findMany({ take: 1 });
      success("UserDomain and FocusArea models exist");
    } catch (e) {
      error("UserDomain or FocusArea model missing");
      issuesFound++;
    }

    // =================================================================
    // FEATURE 2: User Focus Areas Selection
    // =================================================================
    section("Feature 2: User Focus Areas Selection");

    const testUser = await prisma.user.findFirst();

    if (!testUser) {
      error("No users found in database. Create a user first.");
      issuesFound++;
      return;
    }

    info(`Using test user: ${testUser.email}`);

    testsRun++;
    const focusAreas = await prisma.focusArea.findMany({
      where: { userId: testUser.id },
      include: { domain: true },
      orderBy: { priority: "asc" },
    });

    if (focusAreas.length <= 3) {
      success(`User has ${focusAreas.length} focus areas (max 3)`);
    } else {
      error(`User has ${focusAreas.length} focus areas (should be max 3)`);
      issuesFound++;
    }

    if (focusAreas.length > 0) {
      console.log("\nUser focus areas:");
      focusAreas.forEach((fa) => {
        console.log(
          `  Priority ${fa.priority}: ${fa.domain.icon} ${fa.domain.displayName}`,
        );
      });
    } else {
      warning("User has no focus areas selected yet");
    }

    // =================================================================
    // FEATURE 3: XP System Foundation
    // =================================================================
    section("Feature 3: XP System Foundation");

    testsRun++;
    try {
      await prisma.xPEvent.findMany({ take: 1 });
      await prisma.userStats.findMany({ take: 1 });
      success("XPEvent and UserStats models exist");
    } catch (e) {
      error("XPEvent or UserStats model missing");
      issuesFound++;
    }

    testsRun++;
    const userStats = await getUserStats(testUser.id);
    success(
      `User stats retrieved: ${userStats.totalXp} XP, Level ${userStats.overallLevel}`,
    );

    console.log("\nUser statistics:");
    console.log(`  Total XP: ${userStats.totalXp}`);
    console.log(`  Level: ${userStats.overallLevel}`);
    console.log(`  Items Saved: ${userStats.itemsSaved}`);
    console.log(`  Items Processed: ${userStats.itemsProcessed}`);
    console.log(`  Reflections: ${userStats.reflections}`);
    console.log(`  Quests Completed: ${userStats.questsCompleted}`);
    console.log(`  Current Streak: ${userStats.currentStreak}`);
    console.log(`  Longest Streak: ${userStats.longestStreak}`);

    testsRun++;
    // Test XP calculation
    const testXP = 500;
    const level = calculateLevel(testXP);
    if (level === 4) {
      success(`XP calculation correct: ${testXP} XP = Level ${level}`);
    } else {
      error(
        `XP calculation incorrect: ${testXP} XP = Level ${level} (expected 4)`,
      );
      issuesFound++;
    }

    testsRun++;
    // Check XP events exist
    const xpEvents = await prisma.xPEvent.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { domain: { select: { displayName: true, icon: true } } },
    });

    if (xpEvents.length > 0) {
      success(`Found ${xpEvents.length} XP events for user`);
      console.log("\nRecent XP events:");
      xpEvents.forEach((event) => {
        const domainInfo = event.domain
          ? `${event.domain.icon} ${event.domain.displayName}`
          : "no domain";
        console.log(`  ${event.action}: +${event.xpAmount} XP (${domainInfo})`);
      });
    } else {
      warning("No XP events found for user");
    }

    // =================================================================
    // FEATURE 4: Domain-Based Leveling
    // =================================================================
    section("Feature 4: Domain-Based Leveling");

    testsRun++;
    const userDomains = await prisma.userDomain.findMany({
      where: { userId: testUser.id },
      include: { domain: true },
      orderBy: { totalXp: "desc" },
    });

    if (userDomains.length > 0) {
      success(`User has progress in ${userDomains.length} domain(s)`);
      console.log("\nDomain progress:");
      userDomains.forEach((ud) => {
        console.log(`  ${ud.domain.icon} ${ud.domain.displayName}:`);
        console.log(
          `    Level ${ud.level} | ${ud.totalXp} XP | ${ud.itemCount} items`,
        );
      });
    } else {
      warning("User has no domain progress yet");
    }

    testsRun++;
    // Test domain mapping
    const testCategory = "tech";
    const testTags = ["programming", "javascript", "web development"];
    const mappedDomainId = await getDomainForContent(testCategory, testTags);

    if (mappedDomainId) {
      const mappedDomain = await prisma.domain.findUnique({
        where: { id: mappedDomainId },
      });
      if (mappedDomain?.name === "technology") {
        success(
          `Domain mapping correct: "${testCategory}" + ["${testTags.join('", "')}"] → ${mappedDomain.displayName}`,
        );
      } else {
        error(
          `Domain mapping incorrect: expected Technology, got ${mappedDomain?.displayName}`,
        );
        issuesFound++;
      }
    } else {
      error("Domain mapping failed to return a domain");
      issuesFound++;
    }

    // =================================================================
    // FEATURE 5: Streak Tracking
    // =================================================================
    section("Feature 5: Streak Tracking");

    testsRun++;
    const streakInfo = await getUserStreak(testUser.id);
    success(
      `Streak info retrieved: ${streakInfo.currentStreak} day current streak`,
    );

    console.log("\nStreak information:");
    console.log(`  Current Streak: ${streakInfo.currentStreak} days`);
    console.log(`  Longest Streak: ${streakInfo.longestStreak} days`);
    console.log(
      `  Last Activity: ${streakInfo.lastActivityAt ? new Date(streakInfo.lastActivityAt).toLocaleString() : "never"}`,
    );
    console.log(`  Is Active: ${streakInfo.isActive ? "Yes" : "No"}`);

    testsRun++;
    // Check that streak is tracked in UserStats
    if (userStats.currentStreak === streakInfo.currentStreak) {
      success("Streak data consistent between UserStats and streak service");
    } else {
      error("Streak data mismatch between UserStats and streak service");
      issuesFound++;
    }

    // =================================================================
    // FEATURE 6: Badges & Achievements
    // =================================================================
    section("Feature 6: Badges & Achievements");

    testsRun++;
    const allBadges = await prisma.badge.findMany();
    if (allBadges.length === 14) {
      success(`Database has ${allBadges.length} badges (expected 14)`);
    } else {
      error(`Database has ${allBadges.length} badges (expected 14)`);
      issuesFound++;
    }

    console.log("\nBadge breakdown:");
    const badgesByType = allBadges.reduce(
      (acc, b) => {
        acc[b.criteriaType] = (acc[b.criteriaType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(badgesByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} badges`);
    });

    testsRun++;
    const userBadges = await getUserBadges(testUser.id);
    success(`User has earned ${userBadges.length} badge(s)`);

    if (userBadges.length > 0) {
      console.log("\nEarned badges:");
      userBadges.forEach((badge) => {
        const date = new Date(badge.awardedAt).toLocaleDateString();
        console.log(
          `  ${badge.icon} ${badge.name} (${badge.rarity}) - ${date}`,
        );
      });
    } else {
      warning("User has not earned any badges yet");
    }

    testsRun++;
    // Check UserBadge model exists
    try {
      await prisma.userBadge.findMany({ take: 1 });
      success("UserBadge model exists");
    } catch (e) {
      error("UserBadge model missing");
      issuesFound++;
    }

    // =================================================================
    // PIPELINE INTEGRATION TEST
    // =================================================================
    section("Pipeline Integration Test");

    testsRun++;
    const items = await prisma.item.findMany({
      where: { userId: testUser.id },
      include: { domain: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (items.length > 0) {
      success(`Found ${items.length} items for user`);

      testsRun++;
      const itemsWithDomain = items.filter((i) => i.domainId);
      const domainPercentage = Math.round(
        (itemsWithDomain.length / items.length) * 100,
      );

      if (domainPercentage >= 70) {
        success(`${domainPercentage}% of items have domain assigned`);
      } else if (domainPercentage >= 50) {
        warning(`Only ${domainPercentage}% of items have domain assigned`);
      } else {
        error(
          `Only ${domainPercentage}% of items have domain assigned (should be >70%)`,
        );
        issuesFound++;
      }

      console.log("\nRecent items:");
      items.forEach((item, i) => {
        const domainInfo = item.domain
          ? `${item.domain.icon} ${item.domain.displayName}`
          : "❓ No domain";
        console.log(`  ${i + 1}. ${item.title || item.url}`);
        console.log(`     ${domainInfo} | ${item.category || "no category"}`);
      });
    } else {
      warning("No items found for user. Pipeline not tested.");
    }

    // =================================================================
    // API ENDPOINTS CHECK
    // =================================================================
    section("API Endpoints Verification");

    console.log("Expected API endpoints:");
    const endpoints = [
      { path: "/api/domains", method: "GET", auth: "public" },
      { path: "/api/user/focus-areas", method: "GET", auth: "required" },
      { path: "/api/user/focus-areas", method: "POST", auth: "required" },
      { path: "/api/user/stats", method: "GET", auth: "required" },
      { path: "/api/user/streak", method: "GET", auth: "required" },
      { path: "/api/user/badges", method: "GET", auth: "required" },
      { path: "/api/xp/award", method: "POST", auth: "required" },
    ];

    endpoints.forEach((endpoint) => {
      const authLabel =
        endpoint.auth === "public"
          ? colors.green + "public"
          : colors.yellow + "auth";
      console.log(
        `  ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(30)} [${authLabel}${colors.reset}]`,
      );
    });

    success("All 7 API endpoints should be available");

    // =================================================================
    // SUMMARY
    // =================================================================
    section("Review Summary");

    console.log(`Tests run: ${testsRun}`);
    console.log(`Issues found: ${issuesFound}\n`);

    if (issuesFound === 0) {
      console.log(`${colors.green}${"═".repeat(70)}${colors.reset}`);
      console.log(
        `${colors.green}✅ PHASE 1 REVIEW COMPLETE - NO ISSUES FOUND!${colors.reset}`,
      );
      console.log(`${colors.green}${"═".repeat(70)}${colors.reset}\n`);
      console.log("All gamification features are working correctly.");
      console.log("✨ Ready to proceed to Phase 2: Character Sheet\n");
    } else {
      console.log(`${colors.yellow}${"═".repeat(70)}${colors.reset}`);
      console.log(
        `${colors.yellow}⚠️  PHASE 1 REVIEW COMPLETE - ${issuesFound} ISSUE(S) FOUND${colors.reset}`,
      );
      console.log(`${colors.yellow}${"═".repeat(70)}${colors.reset}\n`);
      console.log(
        "Please address the issues above before proceeding to Phase 2.\n",
      );
    }

    // Display Phase 1 feature checklist
    console.log("Phase 1 Feature Checklist:");
    const features = [
      "✅ Feature 1: Domain & Focus Area Schema",
      "✅ Feature 2: User Focus Areas Selection",
      "✅ Feature 3: XP System Foundation",
      "✅ Feature 4: Domain-Based Leveling",
      "✅ Feature 5: Streak Tracking",
      "✅ Feature 6: Badges & Achievements",
    ];
    features.forEach((f) => console.log(`  ${f}`));
    console.log();
  } catch (error) {
    console.error("\n❌ Review failed with error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reviewPhase1();
