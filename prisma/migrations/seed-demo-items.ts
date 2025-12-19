import { PrismaClient } from "../../src/generated/prisma/index.js";

const DEMO_USER_CLERK_ID = "demo_user_readonly";

type DemoItem = {
  url: string;
  title: string;
  summary: string;
  author?: string;
  category:
    | "tech"
    | "business"
    | "design"
    | "productivity"
    | "learning"
    | "lifestyle"
    | "entertainment"
    | "news"
    | "other";
  type: "learn" | "do" | "reference";
  tags: string[];
  note?: string;
};

/**
 * INSTRUCTIONS:
 *
 * 1. Replace the items below with real content from various platforms
 * 2. Aim for 20-30 high-quality items
 * 3. Mix of platforms: Reddit, Twitter, YouTube, Medium, Dev.to, etc.
 * 4. Variety of categories and types
 * 5. Include realistic tags that demonstrate the tagging system
 * 6. Add helpful notes to show the note-taking feature
 *
 * CONTENT GUIDELINES:
 * - Choose evergreen content (not time-sensitive)
 * - Mix of technical and non-technical
 * - Representative of what users would actually save
 * - Showcase different content types (articles, videos, threads, etc.)
 */

const DEMO_ITEMS: DemoItem[] = [
  // EXAMPLE: Reddit post
  {
    url: "https://www.reddit.com/r/programming/comments/example",
    title: "Example: How I Built My First Chrome Extension",
    summary:
      "A detailed guide on building a Chrome extension from scratch, including manifest setup, permissions, and deployment.",
    author: "example_dev",
    category: "tech",
    type: "learn",
    tags: ["chrome-extension", "javascript", "tutorial"],
    note: "Great starter guide for browser extensions",
  },

  // EXAMPLE: YouTube video
  {
    url: "https://www.youtube.com/watch?v=example",
    title: "Example: Introduction to System Design",
    summary:
      "Comprehensive overview of system design principles, covering scalability, load balancing, and database architecture.",
    author: "Tech Channel",
    category: "tech",
    type: "learn",
    tags: ["system-design", "architecture", "scalability"],
  },

  // EXAMPLE: Twitter thread
  {
    url: "https://twitter.com/example/status/123",
    title: "Example: 10 Lessons from Building a Startup",
    summary:
      "Key insights and lessons learned from building and scaling a SaaS startup, including hiring, product development, and fundraising.",
    author: "@founder",
    category: "business",
    type: "reference",
    tags: ["startup", "entrepreneurship", "lessons"],
    note: "Bookmark for future reference",
  },

  // EXAMPLE: Medium article
  {
    url: "https://medium.com/@author/example-article",
    title: "Example: The Art of Code Reviews",
    summary:
      "Best practices for conducting effective code reviews that improve code quality without slowing down development.",
    author: "Senior Engineer",
    category: "productivity",
    type: "do",
    tags: ["code-review", "best-practices", "team"],
  },

  // ADD YOUR REAL CONTENT BELOW
  // Copy the structure above and fill in with actual URLs and content
  // Aim for 20-30 items across different platforms and categories

  // TODO: Add Reddit posts
  // TODO: Add Twitter threads
  // TODO: Add YouTube videos
  // TODO: Add blog articles (Medium, Dev.to, personal blogs)
  // TODO: Add GitHub repos
  // TODO: Add documentation links
];

async function seedDemoItems() {
  const prisma = new PrismaClient();

  try {
    console.log("Finding demo user...");

    const demoUser = await prisma.user.findUnique({
      where: { clerkId: DEMO_USER_CLERK_ID },
    });

    if (!demoUser) {
      console.error("❌ Demo user not found. Run create-demo-user.ts first.");
      process.exit(1);
    }

    console.log("✅ Found demo user:", demoUser.id);

    // Check if demo items already exist
    const existingCount = await prisma.item.count({
      where: { userId: demoUser.id },
    });

    if (existingCount > 0) {
      console.log(`⚠️  Demo user already has ${existingCount} items.`);
      console.log("Do you want to delete existing items and reseed? (yes/no)");

      // For non-interactive, skip reseeding
      console.log("Skipping reseed. Delete items manually if needed.");
      process.exit(0);
    }

    console.log(`\nSeeding ${DEMO_ITEMS.length} demo items...`);

    // Create items
    for (const [index, itemData] of DEMO_ITEMS.entries()) {
      try {
        const item = await prisma.item.create({
          data: {
            userId: demoUser.id,
            url: itemData.url,
            title: itemData.title,
            summary: itemData.summary,
            author: itemData.author,
            category: itemData.category,
            type: itemData.type,
            tags: itemData.tags,
            note: itemData.note,
            status: "new",
            source: new URL(itemData.url).hostname.replace("www.", ""),
          },
        });

        console.log(`  ✓ [${index + 1}/${DEMO_ITEMS.length}] ${item.title}`);
      } catch (error) {
        console.error(`  ✗ Failed to create item: ${itemData.title}`);
        console.error(`    Error:`, error);
      }
    }

    console.log("\n✅ Demo items seeded successfully!");
    console.log(`   Total items: ${DEMO_ITEMS.length}`);
  } catch (error) {
    console.error("❌ Failed to seed demo items:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoItems();
