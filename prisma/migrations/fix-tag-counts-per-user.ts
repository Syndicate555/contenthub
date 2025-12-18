/**
 * Fix tag counts to be per-user instead of global
 *
 * CRITICAL ISSUE: usageCount was being calculated globally across all users,
 * but API queries filter by userId. This causes mismatches.
 *
 * SOLUTION: Calculate usageCount for the primary/active user only.
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function fixTagCountsPerUser() {
  console.log("=".repeat(80));
  console.log("FIXING TAG COUNTS (PER-USER CALCULATION)");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Get the primary user (first user created, assumed to be the main account)
    const primaryUser = await db.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!primaryUser) {
      console.log("❌ No user found");
      return;
    }

    console.log(`Primary user: ${primaryUser.email} (${primaryUser.id})`);
    console.log("Calculating tag counts for THIS USER ONLY\n");

    // Get actual counts for all tags (filtered by user and excluding deleted)
    const actualCounts = await db.itemTag.groupBy({
      by: ["tagId"],
      where: {
        item: {
          userId: primaryUser.id,  // ← KEY FIX: Filter by user
          status: { not: "deleted" },
        },
      },
      _count: {
        tagId: true,
      },
    });

    console.log(`Found ${actualCounts.length} tags with items for this user\n`);

    // Create a map of tagId -> actual count
    const countMap = new Map(
      actualCounts.map((item) => [item.tagId, item._count.tagId]),
    );

    // Get all tags
    const allTags = await db.tag.findMany({
      select: { id: true, displayName: true, name: true, usageCount: true },
    });

    let fixedCount = 0;
    let totalDrift = 0;
    const updates: Array<{
      id: string;
      displayName: string;
      oldCount: number;
      newCount: number;
      drift: number;
    }> = [];

    // Check each tag
    for (const tag of allTags) {
      const actualCount = countMap.get(tag.id) || 0; // 0 if user has no items with this tag
      const drift = tag.usageCount - actualCount;

      if (drift !== 0) {
        updates.push({
          id: tag.id,
          displayName: tag.displayName,
          oldCount: tag.usageCount,
          newCount: actualCount,
          drift,
        });
        fixedCount++;
        totalDrift += Math.abs(drift);
      }
    }

    if (updates.length === 0) {
      console.log("✅ All tag counts are already correct!\n");
      return;
    }

    console.log(`Found ${updates.length} tags with incorrect counts\n`);

    // Show updates (limit to first 50 for readability)
    console.log("Tag count updates:");
    console.log("-".repeat(80));
    for (const update of updates.slice(0, 50)) {
      const sign = update.drift > 0 ? "-" : "+";
      console.log(
        `  "${update.displayName}": ${update.oldCount} → ${update.newCount} (${sign}${Math.abs(update.drift)})`,
      );
    }

    if (updates.length > 50) {
      console.log(`  ... and ${updates.length - 50} more`);
    }

    console.log("");
    console.log(`Updating ${updates.length} tags...`);

    // Batch update all tags
    await Promise.all(
      updates.map((update) =>
        db.tag.update({
          where: { id: update.id },
          data: { usageCount: update.newCount },
        }),
      ),
    );

    console.log("✅ All tags updated\n");

    console.log("=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Tags with incorrect counts: ${fixedCount}`);
    console.log(`Total drift corrected: ${totalDrift}`);
    console.log(`Calculation method: Per-user (${primaryUser.email})`);
    console.log("=".repeat(80));

    // Verify specific tags mentioned by user
    console.log("\nVerifying specific tags:");
    console.log("-".repeat(80));

    const testTags = ["education", "user experience", "authentication", "social media", "ai"];

    for (const tagName of testTags) {
      const tag = await db.tag.findFirst({
        where: {
          OR: [
            { displayName: { equals: tagName, mode: "insensitive" } },
            { normalizedName: tagName.toLowerCase().replace(/\s+/g, " ") },
          ],
        },
      });

      if (!tag) {
        console.log(`  "${tagName}": Not found`);
        continue;
      }

      const apiCount = await db.item.count({
        where: {
          userId: primaryUser.id,
          status: { not: "deleted" },
          itemTags: {
            some: {
              tagId: tag.id,
            },
          },
        },
      });

      const match = tag.usageCount === apiCount ? "✓" : "✗";
      console.log(
        `  ${match} "${tag.displayName}": usageCount=${tag.usageCount}, API=${apiCount}`,
      );
    }

  } catch (error) {
    console.error("Fix failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

fixTagCountsPerUser()
  .then(() => {
    console.log("\n✅ Fix complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  });
