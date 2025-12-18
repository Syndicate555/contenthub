/**
 * Find and fix orphaned ItemTag records
 * These are ItemTag records that point to non-existent items or items from other users
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function findOrphanedItemTags() {
  console.log("Finding orphaned ItemTag records...\n");

  try {
    // Get the current user
    const user = await db.user.findFirst();
    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log(`User: ${user.email} (${user.id})\n`);

    // Find the ai tag
    const aiTag = await db.tag.findFirst({
      where: { normalizedName: "ai" },
      select: { id: true, displayName: true },
    });

    if (!aiTag) {
      console.log("❌ ai tag not found");
      return;
    }

    console.log(`Checking ItemTag records for "${aiTag.displayName}" tag...\n`);

    // Get all ItemTag records for this tag
    const allItemTags = await db.itemTag.findMany({
      where: { tagId: aiTag.id },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true,
          },
        },
      },
    });

    console.log(`Total ItemTag records: ${allItemTags.length}\n`);

    // Check for orphaned ItemTags
    const orphaned: Array<{
      itemTagId: string;
      itemId: string;
      reason: string;
      item: any;
    }> = [];

    for (const itemTag of allItemTags) {
      if (!itemTag.item) {
        orphaned.push({
          itemTagId: itemTag.id,
          itemId: itemTag.itemId,
          reason: "Item does not exist (hard deleted)",
          item: null,
        });
      } else if (itemTag.item.userId !== user.id) {
        orphaned.push({
          itemTagId: itemTag.id,
          itemId: itemTag.itemId,
          reason: `Belongs to different user (${itemTag.item.userId})`,
          item: itemTag.item,
        });
      } else if (itemTag.item.status !== "deleted") {
        // This is a non-deleted item that should be visible
        // Let's verify it's actually returned by the API query
        const apiCheck = await db.item.findFirst({
          where: {
            id: itemTag.itemId,
            userId: user.id,
            status: { not: "deleted" },
            itemTags: {
              some: {
                tagId: aiTag.id,
              },
            },
          },
        });

        if (!apiCheck) {
          orphaned.push({
            itemTagId: itemTag.id,
            itemId: itemTag.itemId,
            reason: "Item exists but not returned by API query",
            item: itemTag.item,
          });
        }
      }
    }

    if (orphaned.length === 0) {
      console.log("✓ No orphaned ItemTag records found");
      return;
    }

    console.log(`⚠️  Found ${orphaned.length} orphaned ItemTag record(s):\n`);

    for (const orphan of orphaned) {
      console.log(`ItemTag ID: ${orphan.itemTagId}`);
      console.log(`Item ID: ${orphan.itemId}`);
      console.log(`Reason: ${orphan.reason}`);
      if (orphan.item) {
        console.log(`Item Title: "${orphan.item.title}"`);
        console.log(`Item Status: ${orphan.item.status}`);
        console.log(`Item User: ${orphan.item.userId}`);
      }
      console.log("");
    }

    // Ask to delete orphaned records
    console.log("Deleting orphaned ItemTag records...");

    const deletedCount = await db.itemTag.deleteMany({
      where: {
        id: { in: orphaned.map((o) => o.itemTagId) },
      },
    });

    console.log(`✅ Deleted ${deletedCount.count} orphaned ItemTag record(s)`);

    // Recalculate tag count
    const correctCount = await db.itemTag.count({
      where: {
        tagId: aiTag.id,
        item: {
          status: { not: "deleted" },
          userId: user.id,
        },
      },
    });

    console.log(`\nUpdating tag usageCount to ${correctCount}...`);

    await db.tag.update({
      where: { id: aiTag.id },
      data: { usageCount: correctCount },
    });

    console.log(`✅ Tag usageCount updated: ${correctCount}`);

  } catch (error) {
    console.error("Failed to find orphaned ItemTags:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

findOrphanedItemTags()
  .then(() => {
    console.log("\n✅ Script complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
