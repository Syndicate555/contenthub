/**
 * Comprehensive diagnosis of tag count mismatches
 * Checks all tags and identifies patterns in discrepancies
 */

import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

async function diagnoseAllTagMismatches() {
  console.log("=".repeat(80));
  console.log("COMPREHENSIVE TAG MISMATCH DIAGNOSIS");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Get the primary user
    const user = await db.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log(`Analyzing tags for user: ${user.email} (${user.id})\n`);

    // Get all tags with their stored usageCount
    const allTags = await db.tag.findMany({
      where: { usageCount: { gt: 0 } },
      select: {
        id: true,
        displayName: true,
        name: true,
        normalizedName: true,
        usageCount: true,
      },
      orderBy: { usageCount: "desc" },
    });

    console.log(`Found ${allTags.length} tags with usageCount > 0\n`);

    const mismatches: Array<{
      tag: string;
      storedCount: number;
      actualCount: number;
      apiCount: number;
      discrepancy: number;
      details: string;
    }> = [];

    let checkedCount = 0;
    const tagsToCheck = allTags.slice(0, 50); // Check top 50 tags

    console.log("Checking tag counts...\n");

    for (const tag of tagsToCheck) {
      checkedCount++;

      // Method 1: Count ItemTag records with non-deleted items for this user
      const itemTagCount = await db.itemTag.count({
        where: {
          tagId: tag.id,
          item: {
            userId: user.id,
            status: { not: "deleted" },
          },
        },
      });

      // Method 2: Simulate exact API query
      const apiCount = await db.item.count({
        where: {
          userId: user.id,
          status: { not: "deleted" },
          itemTags: {
            some: {
              tag: {
                displayName: tag.displayName,
              },
            },
          },
        },
      });

      // Method 3: Count via tag ID (alternative)
      const tagIdCount = await db.item.count({
        where: {
          userId: user.id,
          status: { not: "deleted" },
          itemTags: {
            some: {
              tagId: tag.id,
            },
          },
        },
      });

      const storedCount = tag.usageCount;

      // Check for any mismatches
      if (
        storedCount !== itemTagCount ||
        storedCount !== apiCount ||
        storedCount !== tagIdCount ||
        itemTagCount !== apiCount ||
        itemTagCount !== tagIdCount
      ) {
        let details = "";
        if (itemTagCount !== apiCount) {
          details += `ItemTag count (${itemTagCount}) != API count (${apiCount}). `;
        }
        if (itemTagCount !== tagIdCount) {
          details += `ItemTag count (${itemTagCount}) != TagID count (${tagIdCount}). `;
        }
        if (storedCount !== itemTagCount) {
          details += `Stored (${storedCount}) != ItemTag (${itemTagCount}). `;
        }

        mismatches.push({
          tag: tag.displayName,
          storedCount,
          actualCount: itemTagCount,
          apiCount,
          discrepancy: storedCount - apiCount,
          details: details || "Multiple discrepancies",
        });

        console.log(`⚠️  "${tag.displayName}": stored=${storedCount}, itemTag=${itemTagCount}, API=${apiCount}, tagId=${tagIdCount}`);
      }

      if (checkedCount % 10 === 0) {
        console.log(`  Checked ${checkedCount}/${tagsToCheck.length} tags...`);
      }
    }

    console.log(`\nChecked ${checkedCount} tags total\n`);

    if (mismatches.length === 0) {
      console.log("✅ No mismatches found! All tags are accurate.\n");
      return;
    }

    console.log("=".repeat(80));
    console.log(`FOUND ${mismatches.length} MISMATCHES`);
    console.log("=".repeat(80));
    console.log("");

    // Group by discrepancy amount
    const byDiscrepancy = mismatches.reduce(
      (acc, m) => {
        const key = m.discrepancy.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
      },
      {} as Record<string, typeof mismatches>,
    );

    console.log("Grouped by discrepancy amount:");
    for (const [discrepancy, tags] of Object.entries(byDiscrepancy)) {
      console.log(`  ${discrepancy > "0" ? "+" : ""}${discrepancy}: ${tags.length} tag(s)`);
    }

    console.log("\nDetailed mismatch list:");
    console.log("-".repeat(80));

    for (const m of mismatches.slice(0, 20)) {
      console.log(`"${m.tag}"`);
      console.log(`  Stored: ${m.storedCount}`);
      console.log(`  Actual (ItemTag): ${m.actualCount}`);
      console.log(`  API Query: ${m.apiCount}`);
      console.log(`  Discrepancy: ${m.discrepancy > 0 ? "+" : ""}${m.discrepancy}`);
      console.log(`  Details: ${m.details}`);
      console.log("");
    }

    // Check for the specific tags mentioned by user
    console.log("=".repeat(80));
    console.log("CHECKING SPECIFIC TAGS MENTIONED");
    console.log("=".repeat(80));
    console.log("");

    const specificTags = [
      "education",
      "user experience",
      "authentication",
      "social media",
    ];

    for (const tagName of specificTags) {
      const tag = await db.tag.findFirst({
        where: {
          OR: [
            { displayName: { equals: tagName, mode: "insensitive" } },
            { normalizedName: { equals: tagName.toLowerCase().replace(/\s+/g, " ") } },
          ],
        },
      });

      if (!tag) {
        console.log(`"${tagName}": NOT FOUND in database\n`);
        continue;
      }

      console.log(`"${tag.displayName}" (normalized: "${tag.normalizedName}")`);
      console.log(`  Tag ID: ${tag.id}`);
      console.log(`  Stored usageCount: ${tag.usageCount}`);

      // Get all ItemTag records for this tag
      const itemTags = await db.itemTag.findMany({
        where: { tagId: tag.id },
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

      console.log(`  Total ItemTag records: ${itemTags.length}`);

      const forCurrentUser = itemTags.filter(
        (it) => it.item?.userId === user.id,
      );
      const nonDeleted = forCurrentUser.filter(
        (it) => it.item?.status !== "deleted",
      );

      console.log(`  ItemTag for current user: ${forCurrentUser.length}`);
      console.log(`  ItemTag (non-deleted): ${nonDeleted.length}`);

      // API query
      const apiResult = await db.item.count({
        where: {
          userId: user.id,
          status: { not: "deleted" },
          itemTags: {
            some: {
              tag: {
                displayName: tag.displayName,
              },
            },
          },
        },
      });

      console.log(`  API query result: ${apiResult}`);
      console.log(`  Discrepancy: ${tag.usageCount - apiResult}`);

      if (tag.usageCount !== apiResult) {
        console.log(`  ⚠️  MISMATCH CONFIRMED`);

        // Find which item is being counted but not returned
        const allItemIds = nonDeleted.map((it) => it.itemId);
        const apiItems = await db.item.findMany({
          where: {
            userId: user.id,
            status: { not: "deleted" },
            itemTags: {
              some: {
                tag: {
                  displayName: tag.displayName,
                },
              },
            },
          },
          select: { id: true },
        });

        const apiItemIds = new Set(apiItems.map((i) => i.id));
        const missing = allItemIds.filter((id) => !apiItemIds.has(id));

        if (missing.length > 0) {
          console.log(`  Missing item IDs in API result:`);
          for (const itemId of missing) {
            const itemTag = nonDeleted.find((it) => it.itemId === itemId);
            console.log(`    - ${itemId}: "${itemTag?.item?.title}"`);
          }
        }
      }

      console.log("");
    }

  } catch (error) {
    console.error("Diagnosis failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

diagnoseAllTagMismatches()
  .then(() => {
    console.log("✅ Diagnosis complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Diagnosis failed:", error);
    process.exit(1);
  });
