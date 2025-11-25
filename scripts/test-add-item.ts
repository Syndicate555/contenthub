import { processItem } from "../src/lib/pipeline";
import { db } from "../src/lib/db";

async function main() {
  // Get the user
  const user = await db.user.findFirst();

  if (!user) {
    console.error("No user found");
    process.exit(1);
  }

  console.log("Adding test item for user:", user.email);

  // Add a tech-related item
  const result = await processItem({
    url: "https://example.com/typescript-best-practices",
    note: "Testing XP system - TypeScript best practices",
    userId: user.id,
  });

  console.log("\n✅ Item added successfully!");
  console.log("Item ID:", result.item.id);
  console.log("Title:", result.item.title);
  console.log("Category:", result.item.category);
  console.log("Domain:", result.item.domainId);
  console.log("Success:", result.success);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
