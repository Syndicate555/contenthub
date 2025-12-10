import { db } from "../src/lib/db";

async function checkEmailItem() {
  const items = await db.item.findMany({
    where: {
      importSource: "email",
    },
    include: {
      domain: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  });

  if (items.length === 0) {
    console.log("❌ No email items found");
    return;
  }

  const item = items[0];

  console.log("\n✅ Latest Email Item Found!\n");
  console.log("═══════════════════════════════════════");
  console.log("ID:", item.id);
  console.log("Title:", item.title);
  console.log(
    "Status:",
    item.status,
    item.status === "new" ? "✅ CORRECT" : "❌ WRONG - should be 'new'",
  );
  console.log("User ID:", item.userId);
  console.log("Source:", item.source);
  console.log("Import Source:", item.importSource);
  console.log("External ID:", item.externalId?.substring(0, 50) + "...");
  console.log("Created At:", item.createdAt);
  console.log("\n📊 AI Processing Results:");
  console.log("─────────────────────────────────────");
  console.log("Category:", item.category || "Not assigned");
  console.log("Type:", item.type || "Not assigned");
  console.log("Tags:", item.tags?.join(", ") || "None");
  console.log("\n📝 Summary:");
  console.log("─────────────────────────────────────");
  console.log(item.summary || "No summary generated");
  console.log("\n🎯 Gamification:");
  console.log("─────────────────────────────────────");
  console.log("Domain:", item.domain?.displayName || "None assigned");
  console.log("\n🔗 View in app: http://localhost:3000/today");
  console.log("═══════════════════════════════════════\n");

  await db.$disconnect();
}

checkEmailItem();
