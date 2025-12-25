/**
 * Backfill Script: Platform Data
 *
 * Computes and stores platformData for all existing items in the database.
 * This is a one-time migration script to populate the new platformData field.
 *
 * Usage: npx tsx scripts/backfill-platform-data.ts
 */

import { db } from "../src/lib/db";
import { detectPlatform } from "../src/lib/platform-detector";

async function backfillPlatformData() {
  console.log("Starting platformData backfill...\n");

  // Find all items (we'll filter for null platformData in code)
  const allItems = await db.item.findMany({
    select: {
      id: true,
      url: true,
      source: true,
      embedHtml: true,
      documentUrl: true,
      videoUrl: true,
      title: true,
      summary: true,
      platformData: true,
    },
  });

  // Filter for items that don't have platformData yet
  const items = allItems.filter((item) => !item.platformData);

  console.log(`Found ${items.length} items without platformData\n`);

  if (items.length === 0) {
    console.log("No items to backfill. Exiting.");
    return;
  }

  let processed = 0;
  let errors = 0;

  for (const item of items) {
    try {
      // Compute platformData for this item
      const platformData = detectPlatform({
        url: item.url,
        source: item.source,
        embedHtml: item.embedHtml,
        documentUrl: item.documentUrl,
        videoUrl: item.videoUrl,
        title: item.title,
        summary: item.summary,
      });

      // Update the item with computed platformData
      await db.item.update({
        where: { id: item.id },
        data: { platformData: platformData as any },
      });

      processed++;

      // Log progress every 100 items
      if (processed % 100 === 0) {
        console.log(`Progress: ${processed}/${items.length} items processed`);
      }
    } catch (error) {
      errors++;
      console.error(`Error processing item ${item.id}:`, error);
    }
  }

  console.log("\n=== Backfill Complete ===");
  console.log(`✓ Successfully processed: ${processed} items`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors} items`);
  }
  console.log("");
}

// Run the backfill
backfillPlatformData()
  .then(() => {
    console.log("Backfill script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Backfill script failed:", error);
    process.exit(1);
  });
