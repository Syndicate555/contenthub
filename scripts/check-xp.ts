import { db } from "../src/lib/db";

async function main() {
  console.log("=== Recent Items with Domain ===");
  const items = await db.item.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      domainId: true,
      domain: { select: { name: true } },
      createdAt: true,
    },
  });
  console.log(JSON.stringify(items, null, 2));

  console.log("\n=== XP Events ===");
  const xpEvents = await db.xPEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(JSON.stringify(xpEvents, null, 2));

  console.log("\n=== User Stats ===");
  const stats = await db.userStats.findMany();
  console.log(JSON.stringify(stats, null, 2));

  console.log("\n=== User Domains ===");
  const userDomains = await db.userDomain.findMany({
    include: { domain: { select: { name: true } } },
  });
  console.log(JSON.stringify(userDomains, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
