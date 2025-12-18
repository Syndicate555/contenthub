/**
 * Reconcile tag usage counts
 *
 * Recalculates usageCount for all tags based on actual ItemTag records.
 * This fixes any count drift that occurred before the bug fix.
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function reconcileTagCounts() {
  console.log("Starting tag count reconciliation...\n");

  try {
    // Get all tags
    const allTags = await db.tag.findMany({
      select: { id: true, name: true, displayName: true, usageCount: true },
    });

    console.log(`Found ${allTags.length} tags to reconcile\n`);

    let fixedCount = 0;
    let totalDrift = 0;

    // For each tag, count actual ItemTag records and update
    for (const tag of allTags) {
      // Count actual ItemTag records for this tag
      const actualCount = await db.itemTag.count({
        where: { tagId: tag.id },
      });

      const drift = tag.usageCount - actualCount;

      if (drift !== 0) {
        console.log(
          `Tag "${tag.displayName}" (${tag.name}): stored=${tag.usageCount}, actual=${actualCount}, drift=${drift}`,
        );

        // Update to correct count
        await db.tag.update({
          where: { id: tag.id },
          data: { usageCount: actualCount },
        });

        fixedCount++;
        totalDrift += Math.abs(drift);
      }
    }

    console.log("\n✅ Reconciliation complete!");
    console.log(`Fixed ${fixedCount} tags with incorrect counts`);
    console.log(`Total drift corrected: ${totalDrift}`);

    // Verify the ai tag specifically
    const aiTag = await db.tag.findFirst({
      where: { normalizedName: "ai" },
      select: { displayName: true, usageCount: true },
    });

    if (aiTag) {
      console.log(
        `\n"ai" tag now has correct count: ${aiTag.usageCount} items`,
      );
    }
  } catch (error) {
    console.error("Reconciliation failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

reconcileTagCounts()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
