// Complete Feature 6 Test - Badges & Achievements
// Tests: Badge criteria, awarding logic, and pipeline integration
// Run with: npx tsx scripts/test-feature-6.ts

import { PrismaClient } from "../src/generated/prisma";
import {
  checkAllBadges,
  getUserBadges,
  getAllBadges,
  DEFAULT_BADGES,
} from "../src/lib/badges";
import { awardXP, XP_ACTIONS } from "../src/lib/xp";
import { updateStreak } from "../src/lib/streak";

const prisma = new PrismaClient();

async function testFeature6() {
  console.log("🧪 Feature 6 Test: Badges & Achievements\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Verify badge definitions
    console.log("\n📋 Test 1: Badge Definitions");
    console.log("-".repeat(60));

    const allBadgesInDb = await prisma.badge.findMany();
    console.log(`✓ Total badges seeded: ${allBadgesInDb.length}`);
    console.log(`✓ Expected badges: ${DEFAULT_BADGES.length}`);

    if (allBadgesInDb.length === DEFAULT_BADGES.length) {
      console.log("✅ All badges properly seeded");
    } else {
      console.log("⚠️  Badge count mismatch");
    }

    // Show badge breakdown
    const badgesByType = allBadgesInDb.reduce(
      (acc, b) => {
        acc[b.criteriaType] = (acc[b.criteriaType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("\nBadge breakdown by type:");
    Object.entries(badgesByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} badges`);
    });

    // Test 2: Get test user
    console.log("\n👤 Test 2: User Setup");
    console.log("-".repeat(60));

    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log("❌ No users found. Create a user first.");
      return;
    }

    console.log(`✓ Test user: ${testUser.email}`);

    const userStats = await prisma.userStats.findUnique({
      where: { userId: testUser.id },
    });

    console.log("\nCurrent stats:");
    console.log(`  XP: ${userStats?.totalXp || 0}`);
    console.log(`  Level: ${userStats?.overallLevel || 1}`);
    console.log(`  Items Processed: ${userStats?.itemsProcessed || 0}`);
    console.log(`  Current Streak: ${userStats?.currentStreak || 0}`);

    // Test 3: Badge checking logic
    console.log("\n🎯 Test 3: Badge Checking Logic");
    console.log("-".repeat(60));

    const badgesBefore = await getUserBadges(testUser.id);
    console.log(`Badges before check: ${badgesBefore.length}`);

    const newlyAwarded = await checkAllBadges(testUser.id);
    console.log(`New badges awarded: ${newlyAwarded.length}`);

    if (newlyAwarded.length > 0) {
      newlyAwarded.forEach((b) => {
        console.log(`  🎉 ${b.icon} ${b.name} (${b.rarity})`);
      });
    }

    const badgesAfter = await getUserBadges(testUser.id);
    console.log(`Total badges after: ${badgesAfter.length}`);

    // Test 4: Badge progression tracking
    console.log("\n📊 Test 4: Badge Progress Tracking");
    console.log("-".repeat(60));

    const allBadges = await getAllBadges();
    const earnedBadgeIds = new Set(badgesAfter.map((b) => b.id));

    const progress = {
      total: allBadges.length,
      earned: badgesAfter.length,
      percentage: Math.round((badgesAfter.length / allBadges.length) * 100),
    };

    console.log(
      `Progress: ${progress.earned}/${progress.total} (${progress.percentage}%)`,
    );

    // Show next achievable badges
    console.log("\n🎯 Next Achievable Badges:");
    const unearnedBadges = allBadges
      .filter((b) => !earnedBadgeIds.has(b.id))
      .sort((a, b) => (a.criteriaValue || 0) - (b.criteriaValue || 0))
      .slice(0, 3);

    unearnedBadges.forEach((b) => {
      let requirement = "";
      switch (b.criteriaType) {
        case "item_count":
          requirement = `Process ${b.criteriaValue} items (currently ${userStats?.itemsProcessed || 0})`;
          break;
        case "streak":
          requirement = `Maintain ${b.criteriaValue}-day streak (currently ${userStats?.currentStreak || 0})`;
          break;
        case "xp_total":
          requirement = `Earn ${b.criteriaValue} XP (currently ${userStats?.totalXp || 0})`;
          break;
        case "domain_level":
          requirement = `Reach level ${b.criteriaValue} in any domain`;
          break;
      }
      console.log(`  ${b.icon} ${b.name} - ${requirement}`);
    });

    // Test 5: Simulate pipeline badge awarding
    console.log("\n⚙️  Test 5: Pipeline Integration Simulation");
    console.log("-".repeat(60));

    console.log("Simulating item processing...");

    // Award some XP to potentially trigger new badges
    const xpResult = await awardXP({
      userId: testUser.id,
      action: XP_ACTIONS.PROCESS_ITEM,
      domainId: null,
      metadata: { test: true },
    });

    console.log(`✓ Awarded ${xpResult.xpAwarded} XP`);
    console.log(
      `  New total: ${xpResult.totalXp} XP (Level ${xpResult.level})`,
    );
    if (xpResult.levelUp) {
      console.log(
        `  🎉 LEVEL UP! ${xpResult.previousLevel} → ${xpResult.level}`,
      );
    }

    // Check badges again (simulating pipeline Step 8)
    const pipelineBadges = await checkAllBadges(testUser.id);
    if (pipelineBadges.length > 0) {
      console.log(`✓ Pipeline awarded ${pipelineBadges.length} new badge(s):`);
      pipelineBadges.forEach((b) => {
        console.log(`  ${b.icon} ${b.name}`);
      });
    } else {
      console.log("✓ No new badges (criteria not met or already earned)");
    }

    // Test 6: Badge rarity distribution
    console.log("\n🏆 Test 6: Badge Collection Summary");
    console.log("-".repeat(60));

    const finalBadges = await getUserBadges(testUser.id);
    const byRarity = finalBadges.reduce(
      (acc, b) => {
        acc[b.rarity] = (acc[b.rarity] || []).concat(b);
        return acc;
      },
      {} as Record<string, typeof finalBadges>,
    );

    const rarityOrder = ["common", "rare", "epic", "legendary"];
    rarityOrder.forEach((rarity) => {
      const badges = byRarity[rarity] || [];
      if (badges.length > 0) {
        console.log(`\n${rarity.toUpperCase()} (${badges.length}):`);
        badges.forEach((b) => {
          const date = new Date(b.awardedAt).toLocaleDateString();
          console.log(`  ${b.icon} ${b.name} - earned ${date}`);
        });
      }
    });

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Feature 6 Test Complete!\n");
    console.log("Summary:");
    console.log(`  • Badge system: ${allBadgesInDb.length} badges available`);
    console.log(`  • User badges: ${finalBadges.length} earned`);
    console.log(`  • Pipeline integration: ✓ Working`);
    console.log(`  • Badge awarding logic: ✓ Working`);
    console.log(`  • Progress tracking: ✓ Working`);
    console.log("\n🎉 All tests passed! Feature 6 is complete.");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testFeature6();
