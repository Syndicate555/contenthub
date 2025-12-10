// Migration script to retroactively assign domains to existing items
// Run with: npx tsx scripts/migrate-item-domains.ts

import { PrismaClient } from "../src/generated/prisma";
import { getDomainForContent } from "../src/lib/domains";

const prisma = new PrismaClient();

async function migrateItemDomains() {
  console.log("🔄 Migrating Item Domains\n");
  console.log("Finding items without domain assignments...\n");

  try {
    // Get all items without domains
    const itemsWithoutDomains = await prisma.item.findMany({
      where: { domainId: null },
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
      },
    });

    console.log(`Found ${itemsWithoutDomains.length} items without domains\n`);

    if (itemsWithoutDomains.length === 0) {
      console.log("✅ All items already have domains assigned!\n");
      return;
    }

    let assigned = 0;
    let skipped = 0;

    console.log("Assigning domains...\n");

    for (const item of itemsWithoutDomains) {
      // Skip if no category and no tags
      if (!item.category && item.tags.length === 0) {
        skipped++;
        continue;
      }

      try {
        // Try to determine domain
        const domainId = await getDomainForContent(
          item.category || null,
          item.tags,
        );

        if (domainId) {
          // Update item with domain
          await prisma.item.update({
            where: { id: item.id },
            data: { domainId },
          });

          assigned++;

          // Show progress every 10 items
          if (assigned % 10 === 0) {
            console.log(`  ✓ Assigned ${assigned} domains...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(
          `  ✗ Failed to assign domain for item ${item.id}:`,
          error,
        );
        skipped++;
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("Migration Complete!");
    console.log("=".repeat(60));
    console.log(`Total items processed: ${itemsWithoutDomains.length}`);
    console.log(`Domains assigned: ${assigned}`);
    console.log(`Skipped (no category/tags): ${skipped}`);
    console.log(
      `Success rate: ${Math.round((assigned / itemsWithoutDomains.length) * 100)}%\n`,
    );

    // Show domain distribution after migration
    console.log("Domain distribution after migration:");
    const domainCounts = await prisma.item.groupBy({
      by: ["domainId"],
      _count: true,
    });

    const domainStats = await Promise.all(
      domainCounts
        .filter((d) => d.domainId !== null)
        .map(async (stat) => {
          const domain = await prisma.domain.findUnique({
            where: { id: stat.domainId! },
            select: { displayName: true, icon: true },
          });
          return {
            name: domain?.displayName || "Unknown",
            icon: domain?.icon || "?",
            count: stat._count,
          };
        }),
    );

    domainStats
      .sort((a, b) => b.count - a.count)
      .forEach((stat) => {
        console.log(`  ${stat.icon} ${stat.name}: ${stat.count} items`);
      });

    const unassigned =
      domainCounts.find((d) => d.domainId === null)?._count || 0;
    if (unassigned > 0) {
      console.log(`  ❓ No Domain: ${unassigned} items`);
    }

    console.log();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateItemDomains();
