import { db } from "./db";
import { extractContent, truncateContent } from "./extractor";
import { summarizeContent, summarizeWithVision } from "./openai";
import { getDomainForContent } from "./domains";
import { awardXP, XP_ACTIONS } from "./xp";
import { trackActivity, STREAK_ACTIVITIES } from "./activity";
import { checkAllBadges } from "./badges";
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
  newBadges?: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
  }>;
}

/**
 * Full item processing pipeline:
 * 1. Create item in database with status "new"
 * 2. Fetch and extract content from URL
 * 3. Summarize with OpenAI
 * 4. Update item with processed data
 */
export async function processItem(
  input: ProcessItemInput,
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

  // Award XP for saving the item (we don't know domain yet)
  try {
    await awardXP({
      userId,
      action: XP_ACTIONS.SAVE_ITEM,
      itemId: item.id,
      metadata: { url, source },
    });
  } catch (xpError) {
    console.error("Failed to award save XP:", xpError);
    // Don't fail the whole operation for XP errors
  }

  // Track SAVE_ITEM activity for streak maintenance
  try {
    await trackActivity(userId, STREAK_ACTIVITIES.SAVE_ITEM, {
      itemId: item.id,
    });
  } catch (activityError) {
    console.error("Failed to track save activity:", activityError);
    // Don't fail the whole operation for activity tracking errors
  }

  try {
    // Step 2: Extract content from URL (or use existing rawContent for emails)
    let extracted;
    let contentToSummarize;

    // Check if this is an email item with pre-extracted content
    if (item.rawContent && item.importSource === "email") {
      console.log("Using pre-extracted email content from rawContent");
      extracted = {
        title: item.title || "Email Newsletter",
        content: item.rawContent,
        source: item.source || "email",
      };
      contentToSummarize = item.rawContent;
    } else {
      // Normal URL extraction
      extracted = await extractContent(url);
      contentToSummarize = extracted.content;
    }

    // Step 3: Summarize with OpenAI
    // Use Vision API if content is short but we have an image (e.g., infographics)
    const truncatedContent = truncateContent(contentToSummarize);
    const hasShortContent = !truncatedContent || truncatedContent.length < 100;
    let hasImage = !!extracted.imageUrl;

    // Twitter/X: attempt to fetch via connected Twitter API if available (and not rate limited)
    // Validate supported image types for Vision; otherwise disable Vision
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const isSupportedImage =
      extracted.imageUrl &&
      allowedExtensions.some((ext) =>
        extracted.imageUrl!.toLowerCase().includes(ext),
      );

    if (!isSupportedImage) {
      // Keep the image for display purposes but avoid sending unsupported types to Vision
      hasImage = false;
    }

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

    // Step 4: Determine domain from category and tags
    const domainId = await getDomainForContent(
      summarized.category,
      summarized.tags,
    );

    // Step 5: Update item with processed data including domain
    console.log(
      `Pipeline: Saving item with imageUrl=${extracted.imageUrl ? "YES: " + extracted.imageUrl.substring(0, 80) + "..." : "NO"}, domainId=${domainId || "none"}`,
    );
    const updatedItem = await db.item.update({
      where: { id: item.id },
      data: {
        title: summarized.title,
        summary: summarized.summary.join("\n"),
        tags: summarized.tags,
        author: extracted.author || null,
        type: summarized.type,
        category: summarized.category,
        rawContent: truncatedContent,
        source: extracted.source,
        imageUrl: extracted.imageUrl,
        domainId: domainId || undefined,
      },
    });

    // Step 6: Award XP for processing the item (with domain for domain-specific leveling)
    try {
      await awardXP({
        userId,
        action: XP_ACTIONS.PROCESS_ITEM,
        domainId: domainId || undefined,
        itemId: item.id,
        metadata: {
          category: summarized.category,
          tags: summarized.tags,
          type: summarized.type,
        },
      });
    } catch (xpError) {
      console.error("Failed to award process XP:", xpError);
      // Don't fail the whole operation for XP errors
    }

    // Step 7: Track activity (PROCESS_ITEM) for streak maintenance
    try {
      const activityResult = await trackActivity(
        userId,
        STREAK_ACTIVITIES.PROCESS_ITEM,
        { itemId: updatedItem.id },
      );

      if (activityResult.streakResult) {
        console.log(
          `Activity tracked (PROCESS_ITEM): streak=${activityResult.streakResult.currentStreak}, maintained=${activityResult.streakResult.streakMaintained}`,
        );
      }
    } catch (activityError) {
      console.error("Failed to track activity:", activityError);
      // Don't fail the whole operation for activity tracking errors
    }

    // Step 8: Check and award eligible badges
    let awardedBadges: Array<{
      id: string;
      key: string;
      name: string;
      description: string;
      icon: string;
      rarity: string;
    }> = [];
    try {
      const newBadges = await checkAllBadges(userId);
      if (newBadges.length > 0) {
        console.log(
          `Badges awarded: ${newBadges.map((b) => b.name).join(", ")}`,
        );
        awardedBadges = newBadges.map((badge) => ({
          id: badge.id,
          key: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon || "",
          rarity: badge.rarity,
        }));
      }
    } catch (badgeError) {
      console.error("Failed to check badges:", badgeError);
      // Don't fail the whole operation for badge errors
    }

    return {
      item: updatedItem,
      success: true,
      newBadges: awardedBadges.length > 0 ? awardedBadges : undefined,
    };
  } catch (error) {
    console.error("Pipeline processing failed:", error);

    // Update item to indicate failure but don't delete it
    const failedItem = await db.item.update({
      where: { id: item.id },
      data: {
        title: url,
        summary:
          "Failed to process this URL. You can view the original content.",
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
