/**
 * Debug script to understand why ai tag shows 49 but filters to 30 items
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function debugAiTag() {
  console.log("Debugging ai tag filtering...\n");

  try {
    // Find the ai tag
    const aiTag = await db.tag.findFirst({
      where: { normalizedName: "ai" },
      select: { id: true, displayName: true, usageCount: true },
    });

    if (!aiTag) {
      console.log("❌ ai tag not found");
      return;
    }

    console.log(`Found tag: "${aiTag.displayName}" with usageCount=${aiTag.usageCount}\n`);

    // Count total ItemTag records for this tag
    const totalItemTags = await db.itemTag.count({
      where: { tagId: aiTag.id },
    });

    console.log(`Total ItemTag records: ${totalItemTags}`);

    // Check for duplicate ItemTag records (same itemId with this tag)
    const itemTagsGrouped = await db.itemTag.groupBy({
      by: ["itemId"],
      where: { tagId: aiTag.id },
      _count: {
        itemId: true,
      },
      having: {
        itemId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    if (itemTagsGrouped.length > 0) {
      console.log(`\n⚠️  Found ${itemTagsGrouped.length} items with DUPLICATE ItemTag records for ai tag:`);
      for (const group of itemTagsGrouped) {
        console.log(`  Item ${group.itemId}: ${group._count.itemId} duplicate records`);
      }
    } else {
      console.log(`✓ No duplicate ItemTag records found`);
    }

    // Get all items tagged with ai
    const allItemsWithAi = await db.item.findMany({
      where: {
        itemTags: {
          some: {
            tagId: aiTag.id,
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    console.log(`\nTotal items with ai tag: ${allItemsWithAi.length}`);

    // Group by status
    const byStatus = allItemsWithAi.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("\nItems by status:");
    for (const [status, count] of Object.entries(byStatus)) {
      console.log(`  ${status}: ${count}`);
    }

    // Check for deleted items
    const deletedItems = await db.item.count({
      where: {
        itemTags: {
          some: {
            tagId: aiTag.id,
          },
        },
        status: "deleted",
      },
    });

    console.log(`\nDeleted items with ai tag: ${deletedItems}`);

    // Check what the API query would return (excluding deleted)
    const apiQueryResult = await db.item.count({
      where: {
        itemTags: {
          some: {
            tagId: aiTag.id,
          },
        },
        status: { not: "deleted" },
      },
    });

    console.log(`Items returned by API query (status != deleted): ${apiQueryResult}`);

    console.log("\n" + "=".repeat(60));
    console.log(`SUMMARY:`);
    console.log(`  ItemTag records: ${totalItemTags}`);
    console.log(`  Unique items: ${allItemsWithAi.length}`);
    console.log(`  Non-deleted items: ${apiQueryResult}`);
    console.log(`  Difference (ItemTag - Unique): ${totalItemTags - allItemsWithAi.length}`);

  } catch (error) {
    console.error("Debug failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

debugAiTag()
  .then(() => {
    console.log("\n✅ Debug complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Debug failed:", error);
    process.exit(1);
  });
