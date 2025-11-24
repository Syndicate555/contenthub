import { db } from "./db";
import { extractContent, truncateContent } from "./extractor";
import { summarizeContent, summarizeWithVision } from "./openai";
import type { Item } from "@/generated/prisma";

export interface ProcessItemInput {
  url: string;
  note?: string;
  userId: string;
}

export interface ProcessItemResult {
  item: Item;
  success: boolean;
  error?: string;
}

/**
 * Full item processing pipeline:
 * 1. Create item in database with status "new"
 * 2. Fetch and extract content from URL
 * 3. Summarize with OpenAI
 * 4. Update item with processed data
 */
export async function processItem(
  input: ProcessItemInput
): Promise<ProcessItemResult> {
  const { url, note, userId } = input;

  // Extract source domain
  let source = "unknown";
  try {
    source = new URL(url).hostname;
  } catch {
    // Invalid URL, will be caught later
  }

  // Step 1: Create initial item record
  const item = await db.item.create({
    data: {
      url,
      note,
      userId,
      source,
      status: "new",
    },
  });

  try {
    // Step 2: Extract content from URL
    const extracted = await extractContent(url);

    // Step 3: Summarize with OpenAI
    // Use Vision API if content is short but we have an image (e.g., infographics)
    const truncatedContent = truncateContent(extracted.content);
    const hasShortContent = !truncatedContent || truncatedContent.length < 100;
    const hasImage = !!extracted.imageUrl;

    let summarized;
    if (hasShortContent && hasImage) {
      // Use Vision API to analyze the image
      console.log("Using Vision API for image analysis");
      summarized = await summarizeWithVision({
        title: extracted.title,
        imageUrl: extracted.imageUrl!,
        url,
        source: extracted.source,
        userNote: note,
        textContent: truncatedContent,
      });
    } else {
      // Use text-only summarization
      summarized = await summarizeContent({
        title: extracted.title,
        content: truncatedContent,
        url,
        source: extracted.source,
        userNote: note,
      });
    }

    // Step 4: Update item with processed data
    // Skip saving imageUrl for Instagram (cropped og:image is misleading)
    const isInstagram = extracted.source.includes("instagram.com");
    const imageUrlToSave = isInstagram ? undefined : extracted.imageUrl;

    const updatedItem = await db.item.update({
      where: { id: item.id },
      data: {
        title: summarized.title,
        summary: summarized.summary.join("\n"),
        tags: summarized.tags,
        type: summarized.type,
        category: summarized.category,
        rawContent: truncatedContent,
        source: extracted.source,
        imageUrl: imageUrlToSave,
      },
    });

    return {
      item: updatedItem,
      success: true,
    };
  } catch (error) {
    console.error("Pipeline processing failed:", error);

    // Update item to indicate failure but don't delete it
    const failedItem = await db.item.update({
      where: { id: item.id },
      data: {
        title: url,
        summary: "Failed to process this URL. You can view the original content.",
        tags: ["processing_failed"],
      },
    });

    return {
      item: failedItem,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get or create a user in the database from their Clerk ID
 */
export async function getOrCreateUser(clerkId: string, email: string) {
  const existingUser = await db.user.findUnique({
    where: { clerkId },
  });

  if (existingUser) {
    return existingUser;
  }

  return db.user.create({
    data: {
      clerkId,
      email,
    },
  });
}
