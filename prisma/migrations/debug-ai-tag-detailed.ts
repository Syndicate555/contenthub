/**
 * Comprehensive debug script to find the 1-item discrepancy
 * Tag shows 30 but only 29 items displayed
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function debugAiTagDetailed() {
  console.log("=".repeat(70));
  console.log("COMPREHENSIVE DEBUG: AI TAG DISCREPANCY");
  console.log("=".repeat(70));

  try {
    // Get user ID (assuming single user for now)
    const user = await db.user.findFirst();
    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log(`\nUser: ${user.email} (${user.id})\n`);

    // Find the ai tag
    const aiTag = await db.tag.findFirst({
      where: { normalizedName: "ai" },
      select: { id: true, displayName: true, usageCount: true },
    });

    if (!aiTag) {
      console.log("❌ ai tag not found");
      return;
    }

    console.log("1. TAG INFORMATION");
    console.log("-".repeat(70));
    console.log(`Tag: "${aiTag.displayName}"`);
    console.log(`Tag ID: ${aiTag.id}`);
    console.log(`usageCount: ${aiTag.usageCount}\n`);

    // Count ItemTag records
    console.log("2. ITEMTAG RECORDS");
    console.log("-".repeat(70));

    const totalItemTags = await db.itemTag.count({
      where: { tagId: aiTag.id },
    });
    console.log(`Total ItemTag records: ${totalItemTags}`);

    const itemTagsWithNonDeleted = await db.itemTag.count({
      where: {
        tagId: aiTag.id,
        item: { status: { not: "deleted" } },
      },
    });
    console.log(`ItemTag with non-deleted items: ${itemTagsWithNonDeleted}\n`);

    // Check for duplicate ItemTag records
    console.log("3. DUPLICATE CHECK");
    console.log("-".repeat(70));

    const allItemTags = await db.itemTag.findMany({
      where: { tagId: aiTag.id },
      select: { id: true, itemId: true },
    });

    const itemIdCounts = allItemTags.reduce(
      (acc, it) => {
        acc[it.itemId] = (acc[it.itemId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const duplicates = Object.entries(itemIdCounts).filter(
      ([_, count]) => count > 1,
    );

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} items with duplicate ItemTag records:`);
      for (const [itemId, count] of duplicates) {
        console.log(`  Item ${itemId}: ${count} records`);

        // Show the duplicate ItemTag records
        const dups = await db.itemTag.findMany({
          where: { tagId: aiTag.id, itemId },
          select: { id: true, createdAt: true },
        });
        dups.forEach((d) => {
          console.log(`    - ItemTag ID: ${d.id}, Created: ${d.createdAt}`);
        });
      }
    } else {
      console.log("✓ No duplicate ItemTag records\n");
    }

    // Get all items with this tag (what the count is based on)
    console.log("4. ITEMS WITH AI TAG (NON-DELETED)");
    console.log("-".repeat(70));

    const itemsWithAiTag = await db.item.findMany({
      where: {
        userId: user.id,
        itemTags: {
          some: {
            tagId: aiTag.id,
          },
        },
        status: { not: "deleted" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Total items (excluding deleted): ${itemsWithAiTag.length}\n`);

    // Simulate the exact API query
    console.log("5. SIMULATING API QUERY");
    console.log("-".repeat(70));

    const apiWhere = {
      userId: user.id,
      status: { not: "deleted" as const },
      itemTags: {
        some: {
          tag: {
            displayName: "ai",
          },
        },
      },
    };

    const apiCount = await db.item.count({ where: apiWhere });
    console.log(`API count query result: ${apiCount}`);

    const apiItems = await db.item.findMany({
      where: apiWhere,
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });
    console.log(`API items query result: ${apiItems.length}\n`);

    // Check if any items are being filtered differently
    console.log("6. DISCREPANCY ANALYSIS");
    console.log("-".repeat(70));

    const countDiff = itemsWithAiTag.length - apiItems.length;
    if (countDiff !== 0) {
      console.log(`⚠️  DISCREPANCY FOUND: ${countDiff} item(s) difference`);

      const itemsWithAiIds = new Set(itemsWithAiTag.map((i) => i.id));
      const apiItemIds = new Set(apiItems.map((i) => i.id));

      const inCountNotInApi = itemsWithAiTag.filter(
        (i) => !apiItemIds.has(i.id),
      );
      const inApiNotInCount = apiItems.filter((i) => !itemsWithAiIds.has(i.id));

      if (inCountNotInApi.length > 0) {
        console.log("\nItems in count query but NOT in API query:");
        inCountNotInApi.forEach((item) => {
          console.log(`  - ${item.id}: "${item.title}" (${item.status})`);
        });
      }

      if (inApiNotInCount.length > 0) {
        console.log("\nItems in API query but NOT in count query:");
        inApiNotInCount.forEach((item) => {
          console.log(`  - ${item.id}: "${item.title}" (${item.status})`);
        });
      }
    } else {
      console.log("✓ No discrepancy between count and items queries");
    }

    // Check tag usageCount accuracy
    console.log("\n7. TAG COUNT ACCURACY");
    console.log("-".repeat(70));

    const expectedCount = await db.itemTag.count({
      where: {
        tagId: aiTag.id,
        item: {
          status: { not: "deleted" },
          userId: user.id,
        },
      },
    });

    console.log(`Expected usageCount (ItemTag with non-deleted items): ${expectedCount}`);
    console.log(`Current usageCount in Tag table: ${aiTag.usageCount}`);
    console.log(`Difference: ${aiTag.usageCount - expectedCount}`);

    if (aiTag.usageCount !== expectedCount) {
      console.log("\n⚠️  Tag usageCount needs to be updated!");
      console.log(`Should be: ${expectedCount}, currently: ${aiTag.usageCount}`);
    } else {
      console.log("\n✓ Tag usageCount is correct");
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`Tag displays: ${aiTag.usageCount}`);
    console.log(`Items returned by API: ${apiItems.length}`);
    console.log(`Discrepancy: ${aiTag.usageCount - apiItems.length}`);
    console.log("=".repeat(70));

  } catch (error) {
    console.error("Debug failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

debugAiTagDetailed()
  .then(() => {
    console.log("\n✅ Debug complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Debug failed:", error);
    process.exit(1);
  });
