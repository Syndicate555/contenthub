// Test script for badge system
// Run with: npx tsx scripts/test-badges.ts

import { PrismaClient } from "../src/generated/prisma";
import { checkAllBadges, getUserBadges } from "../src/lib/badges";

const prisma = new PrismaClient();

async function testBadgeSystem() {
  console.log("🧪 Testing Badge System\n");

  try {
    // Get a test user (or create one)
    const testUser = await prisma.user.findFirst();

    if (!testUser) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }

    console.log(`✓ Testing with user: ${testUser.email}`);
    console.log(`  User ID: ${testUser.id}\n`);

    // Get current stats
    const stats = await prisma.userStats.findUnique({
      where: { userId: testUser.id },
    });

    console.log("📊 Current User Stats:");
    console.log(`  Total XP: ${stats?.totalXp || 0}`);
    console.log(`  Level: ${stats?.overallLevel || 1}`);
    console.log(`  Items Processed: ${stats?.itemsProcessed || 0}`);
    console.log(`  Current Streak: ${stats?.currentStreak || 0}`);
    console.log(`  Longest Streak: ${stats?.longestStreak || 0}\n`);

    // Get current badges before check
    const badgesBefore = await getUserBadges(testUser.id);
    console.log(`🏅 Badges Before Check: ${badgesBefore.length}`);
    if (badgesBefore.length > 0) {
      badgesBefore.forEach((b) => {
        console.log(
          `  ${b.icon} ${b.name} (${b.rarity}) - earned ${new Date(b.awardedAt).toLocaleDateString()}`,
        );
      });
    }
    console.log();

    // Check all badges
    console.log("🔍 Checking for eligible badges...\n");
    const newBadges = await checkAllBadges(testUser.id);

    if (newBadges.length === 0) {
      console.log(
        "✓ No new badges awarded (criteria not met or already earned)\n",
      );
    } else {
      console.log(`🎉 NEW BADGES AWARDED: ${newBadges.length}`);
      newBadges.forEach((b) => {
        console.log(`  ${b.icon} ${b.name} (${b.rarity})`);
        console.log(`     ${b.description}`);
      });
      console.log();
    }

    // Get badges after check
    const badgesAfter = await getUserBadges(testUser.id);
    console.log(`🏅 Total Badges After Check: ${badgesAfter.length}`);
    if (badgesAfter.length > 0) {
      // Group by rarity
      const byRarity: Record<string, typeof badgesAfter> = {
        common: [],
        rare: [],
        epic: [],
        legendary: [],
      };
      badgesAfter.forEach((b) => {
        byRarity[b.rarity].push(b);
      });

      Object.entries(byRarity).forEach(([rarity, badges]) => {
        if (badges.length > 0) {
          console.log(`\n  ${rarity.toUpperCase()}:`);
          badges.forEach((b) => {
            console.log(`    ${b.icon} ${b.name}`);
          });
        }
      });
    }
    console.log();

    // Get all available badges for reference
    const allBadges = await prisma.badge.findMany();
    console.log("📋 Badge Criteria Reference:");
    console.log("  ITEM_COUNT:");
    allBadges
      .filter((b) => b.criteriaType === "item_count")
      .sort((a, b) => (a.criteriaValue || 0) - (b.criteriaValue || 0))
      .forEach((b) => {
        const earned = badgesAfter.find((eb) => eb.key === b.key);
        const status = earned ? "✅" : "⬜";
        console.log(
          `    ${status} ${b.icon} ${b.name} - ${b.criteriaValue} items`,
        );
      });

    console.log("\n  STREAK:");
    allBadges
      .filter((b) => b.criteriaType === "streak")
      .sort((a, b) => (a.criteriaValue || 0) - (b.criteriaValue || 0))
      .forEach((b) => {
        const earned = badgesAfter.find((eb) => eb.key === b.key);
        const status = earned ? "✅" : "⬜";
        console.log(
          `    ${status} ${b.icon} ${b.name} - ${b.criteriaValue} day streak`,
        );
      });

    console.log("\n  XP_TOTAL:");
    allBadges
      .filter((b) => b.criteriaType === "xp_total")
      .sort((a, b) => (a.criteriaValue || 0) - (b.criteriaValue || 0))
      .forEach((b) => {
        const earned = badgesAfter.find((eb) => eb.key === b.key);
        const status = earned ? "✅" : "⬜";
        console.log(
          `    ${status} ${b.icon} ${b.name} - ${b.criteriaValue} XP`,
        );
      });

    console.log("\n  DOMAIN_LEVEL:");
    allBadges
      .filter((b) => b.criteriaType === "domain_level")
      .sort((a, b) => (a.criteriaValue || 0) - (b.criteriaValue || 0))
      .forEach((b) => {
        const earned = badgesAfter.find((eb) => eb.key === b.key);
        const status = earned ? "✅" : "⬜";
        console.log(
          `    ${status} ${b.icon} ${b.name} - Level ${b.criteriaValue} in any domain`,
        );
      });

    console.log("\n✅ Badge system test complete!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testBadgeSystem();
