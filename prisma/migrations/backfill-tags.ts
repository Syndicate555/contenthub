/**
 * Migration script to backfill existing tags from Item.tags arrays to Tag + ItemTag tables.
 *
 * This script:
 * 1. Extracts all existing tags from Item.tags arrays
 * 2. Normalizes and deduplicates tags
 * 3. Creates Tag records
 * 4. Creates ItemTag join records
 * 5. Updates usageCount for each tag
 *
 * Usage:
 *   npx tsx prisma/migrations/backfill-tags.ts
 */

import { PrismaClient } from "@/generated/prisma";
import { normalizeTag, isValidTag } from "@/lib/tags/normalize";

const db = new PrismaClient();

interface TagInfo {
  displayName: string; // First occurrence of the tag (for display)
  itemIds: Set<string>; // Items that have this tag
}

async function backfillTags() {
  console.log("Starting tag backfill migration...\n");

  try {
    // Step 1: Collect all existing tags from all items
    console.log("Step 1: Collecting existing tags from items...");
    const items = await db.item.findMany({
      select: { id: true, tags: true },
    });

    console.log(`Found ${items.length} items to process`);

    // Step 2: Normalize and deduplicate tags
    console.log("\nStep 2: Normalizing and deduplicating tags...");
    const tagMap = new Map<string, TagInfo>();

    let totalTagsFound = 0;
    for (const item of items) {
      const itemTags = item.tags || [];
      totalTagsFound += itemTags.length;

      for (const rawTag of itemTags) {
        const normalized = normalizeTag(rawTag);

        // Skip invalid tags
        if (!isValidTag(normalized)) {
          console.log(`  Skipping invalid tag: "${rawTag}"`);
          continue;
        }

        if (!tagMap.has(normalized)) {
          tagMap.set(normalized, {
            displayName: rawTag, // Use first occurrence for display
            itemIds: new Set(),
          });
        }

        tagMap.get(normalized)!.itemIds.add(item.id);
      }
    }

    console.log(
      `  Total tags found: ${totalTagsFound}`,
    );
    console.log(
      `  Unique tags after normalization: ${tagMap.size}`,
    );
    console.log(
      `  Deduplication ratio: ${((1 - tagMap.size / totalTagsFound) * 100).toFixed(1)}%`,
    );

    // Display top 20 most used tags
    console.log("\n  Top 20 most used tags:");
    const sortedTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1].itemIds.size - a[1].itemIds.size)
      .slice(0, 20);

    for (const [normalized, info] of sortedTags) {
      console.log(
        `    ${info.displayName.padEnd(30)} - ${info.itemIds.size} items`,
      );
    }

    // Step 3: Create Tag records
    console.log("\nStep 3: Creating Tag records...");
    const tagRecords: Array<{ id: string; normalizedName: string }> = [];

    let batchSize = 100;
    let batchNum = 0;
    const tagEntries = Array.from(tagMap.entries());

    for (let i = 0; i < tagEntries.length; i += batchSize) {
      const batch = tagEntries.slice(i, i + batchSize);
      batchNum++;

      console.log(
        `  Processing batch ${batchNum}/${Math.ceil(tagEntries.length / batchSize)} (${batch.length} tags)...`,
      );

      const records = await Promise.all(
        batch.map(async ([normalized, info]) => {
          return db.tag.upsert({
            where: { normalizedName: normalized },
            create: {
              name: normalized,
              displayName: info.displayName,
              normalizedName: normalized,
              usageCount: info.itemIds.size,
            },
            update: {
              // If tag already exists, update usage count
              usageCount: info.itemIds.size,
            },
            select: { id: true, normalizedName: true },
          });
        }),
      );

      tagRecords.push(...records);
    }

    console.log(`  Created/updated ${tagRecords.length} tag records`);

    // Step 4: Create ItemTag join records
    console.log("\nStep 4: Creating ItemTag join records...");
    let totalJoinRecords = 0;

    // Build a map for quick lookup: normalized -> tagId
    const normalizedToTagId = new Map(
      tagRecords.map((t) => [t.normalizedName, t.id]),
    );

    batchNum = 0;
    batchSize = 500; // Larger batch size for join records

    for (let i = 0; i < tagEntries.length; i += batchSize) {
      const batch = tagEntries.slice(i, i + batchSize);
      batchNum++;

      console.log(
        `  Processing batch ${batchNum}/${Math.ceil(tagEntries.length / batchSize)}...`,
      );

      // Collect all join records for this batch
      const joinRecords: Array<{ itemId: string; tagId: string }> = [];

      for (const [normalized, info] of batch) {
        const tagId = normalizedToTagId.get(normalized);
        if (!tagId) {
          console.warn(`  Warning: No tag ID found for "${normalized}"`);
          continue;
        }

        for (const itemId of info.itemIds) {
          joinRecords.push({ itemId, tagId });
        }
      }

      // Create join records
      const result = await db.itemTag.createMany({
        data: joinRecords,
        skipDuplicates: true,
      });

      totalJoinRecords += result.count;
    }

    console.log(`  Created ${totalJoinRecords} ItemTag join records`);

    // Step 5: Verify migration
    console.log("\nStep 5: Verifying migration...");
    const tagCount = await db.tag.count();
    const itemTagCount = await db.itemTag.count();

    console.log(`  Total tags in database: ${tagCount}`);
    console.log(`  Total item-tag associations: ${itemTagCount}`);

    // Sample verification: Check a few random items
    console.log("\n  Sample verification (5 random items):");
    const sampleItems = await db.item.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        tags: true,
        itemTags: {
          include: {
            tag: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    for (const item of sampleItems) {
      const oldTags = item.tags || [];
      const newTags = item.itemTags.map((it) => it.tag.displayName);

      console.log(
        `\n    Item: ${item.title?.substring(0, 50) || item.id}`,
      );
      console.log(`      Old tags: ${oldTags.join(", ")}`);
      console.log(`      New tags: ${newTags.join(", ")}`);
      console.log(
        `      Match: ${oldTags.length === newTags.length ? "✓" : "✗"} (${oldTags.length} → ${newTags.length})`,
      );
    }

    console.log("\n✅ Migration completed successfully!");
    console.log(
      "\nNext steps:",
    );
    console.log("  1. Verify the migration by checking a few items in the UI");
    console.log(
      "  2. Once verified, the Item.tags field can be removed in a future migration",
    );
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
backfillTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
