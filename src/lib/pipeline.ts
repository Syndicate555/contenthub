import { db } from "./db";
import {
  extractContent,
  truncateContent,
  type ExtractedContent,
} from "./extractor";
import { summarizeContent, summarizeWithVision } from "./openai";
import { getDomainForContent } from "./domains";
import { awardXP, XP_ACTIONS } from "./xp";
import { trackActivity, STREAK_ACTIVITIES } from "./activity";
import { checkAllBadges } from "./badges";
import { validateItemData } from "./content-validator";
import { assignTagsToItem } from "./tags/service";
import type { Item } from "@/generated/prisma";

export interface ProcessItemInput {
  url: string;
  note?: string;
  userId: string;
  preExtractedData?: ExtractedContent;
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
 * 1. Extract content from URL
 * 2. Validate extracted content
 * 3. Summarize with OpenAI
 * 4. Validate summarized content
 * 5. Create item in database with all processed data
 * 6. Award XP and track activity
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
    throw new Error("Invalid URL format");
  }

  try {
    // Step 1: Extract content from URL
    console.log(`Pipeline: Extracting content from ${url}`);
    const extracted = input.preExtractedData || (await extractContent(url));
    const contentToSummarize = extracted.content;

    // Step 2: Summarize with OpenAI
    // Use Vision API if content is short but we have an image (e.g., infographics)
    const truncatedContent = truncateContent(contentToSummarize);
    const hasShortContent = !truncatedContent || truncatedContent.length < 100;
    let hasImage = !!extracted.imageUrl;

    // Normalize / downgrade Vision usage for Instagram profile-sized images that Vision rejects
    if (
      extracted.imageUrl &&
      extracted.source &&
      extracted.source.toLowerCase().includes("instagram")
    ) {
      // Upsize tiny thumbs when possible
      if (/s150x150/i.test(extracted.imageUrl)) {
        extracted.imageUrl = extracted.imageUrl.replace(
          /s150x150/gi,
          "s1080x1080",
        );
      }
      // If it's a profile-style asset (/t51.2885-19/ or profile_pic), skip Vision to avoid invalid_image_url
      if (/t51\.2885-19|profile_pic/i.test(extracted.imageUrl)) {
        hasImage = false;
      }
    }

    // Validate supported image types for Vision; otherwise disable Vision
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const isSupportedImage =
      extracted.imageUrl &&
      allowedExtensions.some((ext) =>
        extracted.imageUrl!.toLowerCase().includes(ext),
      ) &&
      // Block Instagram/Facebook CDNs as they block OpenAI scanners (Error 400)
      !extracted.imageUrl?.includes("cdninstagram.com") &&
      !extracted.imageUrl?.includes("fbcdn.net");

    if (!isSupportedImage) {
      // Keep the image for display purposes but avoid sending unsupported types to Vision
      hasImage = false;
    }

    let summarized;
    if (hasShortContent && hasImage) {
      // Use Vision API to analyze the image
      console.log("Using Vision API for image analysis");
      try {
        summarized = await summarizeWithVision({
          title: extracted.title,
          imageUrl: extracted.imageUrl!,
          url,
          source: extracted.source,
          userNote: note,
          textContent: truncatedContent,
        });
      } catch (visionError) {
        console.warn(
          "Vision summarization failed, falling back to text summary:",
          visionError,
        );
        // Fallback to text-only summarization
        summarized = await summarizeContent({
          title: extracted.title,
          content: truncatedContent,
          url,
          source: extracted.source,
          userNote: note,
        });
      }
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

    // Step 3: Validate the extracted and summarized content
    console.log("Pipeline: Validating extracted content");
    const validation = validateItemData(extracted, summarized);

    if (!validation.isValid) {
      console.error("Content validation failed:", validation.error);
      throw new Error(
        validation.error || "Content validation failed for unknown reason",
      );
    }

    // Preserve original Reddit title
    if (extracted.source.toLowerCase().includes("reddit")) {
      summarized.title = extracted.title;
    }

    // Step 4: Determine domain from category and tags
    const domainId = await getDomainForContent(
      summarized.category,
      summarized.tags,
    );

    // Step 5: Create item in database with all processed data (with transaction for atomicity)
    console.log(
      `Pipeline: Saving item with imageUrl=${extracted.imageUrl ? "YES" : "NO"}, domainId=${domainId || "none"}`,
    );
    const item = await db.$transaction(async (tx) => {
      // Create the item
      const newItem = await tx.item.create({
        data: {
          url,
          note,
          userId,
          source: extracted.source,
          status: "new",
          title: summarized.title,
          summary: summarized.summary.join("\n"),
          tags: summarized.tags, // Keep for backward compatibility during migration
          author: extracted.author || null,
          type: summarized.type,
          category: summarized.category,
          rawContent: truncatedContent,
          imageUrl: extracted.imageUrl,
          embedHtml: extracted.embedHtml,
          domainId: domainId || undefined,
        },
      });

      // Assign tags using the tag service (creates Tag + ItemTag records)
      await assignTagsToItem(tx, newItem.id, summarized.tags);

      return newItem;
    });

    // Step 6: Award XP for saving the item
    try {
      await awardXP({
        userId,
        action: XP_ACTIONS.SAVE_ITEM,
        itemId: item.id,
        domainId: domainId || undefined,
        metadata: { url, source: extracted.source },
      });
    } catch (xpError) {
      console.error("Failed to award save XP:", xpError);
      // Don't fail the whole operation for XP errors
    }

    // Step 7: Track SAVE_ITEM activity for streak maintenance
    try {
      await trackActivity(userId, STREAK_ACTIVITIES.SAVE_ITEM, {
        itemId: item.id,
      });
    } catch (activityError) {
      console.error("Failed to track save activity:", activityError);
      // Don't fail the whole operation for activity tracking errors
    }

    // Step 8: Award XP for processing the item (with domain for domain-specific leveling)
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

    // Step 9: Track activity (PROCESS_ITEM) for streak maintenance
    try {
      const activityResult = await trackActivity(
        userId,
        STREAK_ACTIVITIES.PROCESS_ITEM,
        { itemId: item.id },
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

    // Step 10: Check and award eligible badges
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
      item,
      success: true,
      newBadges: awardedBadges.length > 0 ? awardedBadges : undefined,
    };
  } catch (error) {
    console.error("Pipeline processing failed:", error);

    // Return error without saving anything to database
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to process this URL. Please try again or contact support.",
    );
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
