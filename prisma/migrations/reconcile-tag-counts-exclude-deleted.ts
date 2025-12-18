/**
 * Reconcile tag usage counts (excluding deleted items)
 *
 * Recalculates usageCount for all tags based on ItemTag records
 * where the item status is NOT 'deleted'.
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function reconcileTagCounts() {
  console.log("Starting tag count reconciliation (excluding deleted items)...\n");

  try {
    // Get actual counts for all tags, excluding deleted items
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

    console.log(`Found ${actualCounts.length} tags with non-deleted items\n`);

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
    const updates: Array<{ id: string; newCount: number; drift: number; name: string }> = [];

    // Check each tag
    for (const tag of allTags) {
      const actualCount = countMap.get(tag.id) || 0; // 0 if tag has no non-deleted items
      const drift = tag.usageCount - actualCount;

      if (drift !== 0) {
        console.log(
          `"${tag.displayName}": stored=${tag.usageCount}, actual=${actualCount}, drift=${drift}`,
        );
        updates.push({ id: tag.id, newCount: actualCount, drift, name: tag.displayName });
        fixedCount++;
        totalDrift += Math.abs(drift);
      }
    }

    if (updates.length === 0) {
      console.log("✓ All tag counts are already correct!");
      return;
    }

    console.log(`\nUpdating ${updates.length} tags...`);

    // Batch update all tags
    await Promise.all(
      updates.map((update) =>
        db.tag.update({
          where: { id: update.id },
          data: { usageCount: update.newCount },
        }),
      ),
    );

    console.log("\n✅ Reconciliation complete!");
    console.log(`Fixed ${fixedCount} tags with incorrect counts`);
    console.log(`Total drift corrected: ${totalDrift}`);

    // Show top corrections
    const topCorrections = updates
      .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
      .slice(0, 10);

    console.log("\nTop 10 corrections:");
    for (const update of topCorrections) {
      console.log(`  "${update.name}": ${update.drift > 0 ? "-" : "+"}${Math.abs(update.drift)}`);
    }

    // Verify the ai tag specifically
    const aiTag = await db.tag.findFirst({
      where: { normalizedName: "ai" },
      select: { displayName: true, usageCount: true },
    });

    if (aiTag) {
      console.log(
        `\n"${aiTag.displayName}" tag now shows: ${aiTag.usageCount} non-deleted items`,
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
