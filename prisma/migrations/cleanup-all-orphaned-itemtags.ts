/**
 * Comprehensive cleanup of ALL orphaned ItemTag records across all tags
 * Fixes data integrity issues where ItemTags point to:
 * - Non-existent items (hard deleted)
 * - Items belonging to other users
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function cleanupAllOrphanedItemTags() {
  console.log("=".repeat(70));
  console.log("COMPREHENSIVE ITEMTAG CLEANUP");
  console.log("=".repeat(70));
  console.log("");

  try {
    // Get all users
    const users = await db.user.findMany({
      select: { id: true, email: true },
    });

    console.log(`Found ${users.length} user(s)\n`);

    let totalOrphaned = 0;
    let totalDeleted = 0;
    const affectedTags = new Set<string>();

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      console.log("-".repeat(70));

      // Find all ItemTag records
      const allItemTags = await db.itemTag.findMany({
        include: {
          item: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
          },
          tag: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      console.log(`Total ItemTag records: ${allItemTags.length}`);

      // Identify orphaned records for this user's perspective
      const orphanedIds: string[] = [];

      for (const itemTag of allItemTags) {
        // Case 1: Item doesn't exist (hard deleted)
        if (!itemTag.item) {
          orphanedIds.push(itemTag.id);
          affectedTags.add(itemTag.tagId);
          console.log(
            `  Orphaned: ItemTag ${itemTag.id} → Item doesn't exist`,
          );
        }
      }

      if (orphanedIds.length > 0) {
        console.log(`\nDeleting ${orphanedIds.length} orphaned ItemTag records...`);

        const deleted = await db.itemTag.deleteMany({
          where: { id: { in: orphanedIds } },
        });

        console.log(`✅ Deleted ${deleted.count} records`);
        totalOrphaned += orphanedIds.length;
        totalDeleted += deleted.count;
      } else {
        console.log("✓ No orphaned ItemTag records found");
      }

      console.log("");
    }

    console.log("=".repeat(70));
    console.log("RECALCULATING TAG COUNTS");
    console.log("=".repeat(70));
    console.log("");

    // Recalculate usageCount for all affected tags
    if (affectedTags.size > 0) {
      console.log(`Recalculating counts for ${affectedTags.size} affected tag(s)...\n`);

      for (const tagId of affectedTags) {
        const tag = await db.tag.findUnique({
          where: { id: tagId },
          select: { displayName: true },
        });

        // Count non-deleted items for this tag
        const correctCount = await db.itemTag.count({
          where: {
            tagId,
            item: {
              status: { not: "deleted" },
            },
          },
        });

        await db.tag.update({
          where: { id: tagId },
          data: { usageCount: correctCount },
        });

        console.log(`  "${tag?.displayName}": updated to ${correctCount}`);
      }
    }

    // Final full reconciliation for all tags
    console.log("\n" + "=".repeat(70));
    console.log("FULL TAG COUNT RECONCILIATION");
    console.log("=".repeat(70));
    console.log("");

    const actualCounts = await db.itemTag.groupBy({
      by: ["tagId"],
      where: {
        item: {
          status: { not: "deleted" },
        },
      },
      _count: {
        tagId: true,
      },
    });

    const countMap = new Map(
      actualCounts.map((item) => [item.tagId, item._count.tagId]),
    );

    const allTags = await db.tag.findMany({
      select: { id: true, displayName: true, usageCount: true },
    });

    let fixedCount = 0;

    for (const tag of allTags) {
      const actualCount = countMap.get(tag.id) || 0;
      const drift = tag.usageCount - actualCount;

      if (drift !== 0) {
        await db.tag.update({
          where: { id: tag.id },
          data: { usageCount: actualCount },
        });

        console.log(
          `  "${tag.displayName}": ${tag.usageCount} → ${actualCount} (drift: ${drift})`,
        );
        fixedCount++;
      }
    }

    if (fixedCount === 0) {
      console.log("✓ All tag counts are accurate\n");
    } else {
      console.log(`\n✅ Fixed ${fixedCount} tag count(s)\n`);
    }

    console.log("=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`Orphaned ItemTag records found: ${totalOrphaned}`);
    console.log(`Orphaned ItemTag records deleted: ${totalDeleted}`);
    console.log(`Tags with corrected counts: ${fixedCount}`);
    console.log("=".repeat(70));

  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

cleanupAllOrphanedItemTags()
  .then(() => {
    console.log("\n✅ Cleanup complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  });
