/**
 * Twitter Bookmark Sync Service
 * Syncs Twitter bookmarks to ContentHub items
 */

import { prisma } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import {
  fetchBookmarks,
  getTwitterConnection,
  type TwitterBookmark,
} from "@/lib/twitter-api";
import type { SocialConnection } from "@/generated/prisma";

export interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Check if a bookmark has already been imported
 */
async function isBookmarkImported(
  userId: string,
  externalId: string
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: {
      userId,
      importSource: "twitter",
      externalId,
    },
  });
  return !!existing;
}

/**
 * Import a single Twitter bookmark as an item
 */
async function importBookmark(
  userId: string,
  bookmark: TwitterBookmark
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for duplicate
    const alreadyImported = await isBookmarkImported(userId, bookmark.id);
    if (alreadyImported) {
      return { success: true }; // Skip silently
    }

    // Create a note from the tweet metadata
    const authorInfo = bookmark.author
      ? `@${bookmark.author.username} (${bookmark.author.name})`
      : "Unknown author";
    const note = `Bookmarked tweet from ${authorInfo}`;

    // Process the bookmark URL through the existing pipeline
    const result = await processItem({
      url: bookmark.url,
      note,
      userId,
    });

    // Get the best available image from Twitter API media
    // Prefer the actual media URL, fallback to preview image/variant
    const twitterMediaUrl =
      bookmark.media?.find((m) => m.url)?.url ||
      bookmark.media?.find((m) => m.previewImageUrl)?.previewImageUrl;

    if (!result.success) {
      // Even if processing fails, update with import metadata and Twitter media
      await prisma.item.update({
        where: { id: result.item.id },
        data: {
          importSource: "twitter",
          externalId: bookmark.id,
          // Use Twitter API media if available, since extraction may have failed
          ...(twitterMediaUrl && { imageUrl: twitterMediaUrl }),
        },
      });
      return {
        success: false,
        error: result.error || "Processing failed",
      };
    }

    // Update the item with import source info and Twitter media
    // Twitter API media takes precedence over any extracted image (if not already set)
    await prisma.item.update({
      where: { id: result.item.id },
      data: {
        importSource: "twitter",
        externalId: bookmark.id,
        // Override with Twitter API media - more reliable than extraction
        ...(twitterMediaUrl && { imageUrl: twitterMediaUrl }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to import bookmark ${bookmark.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync bookmarks for a user's Twitter connection
 */
export async function syncTwitterBookmarks(
  userId: string,
  maxBookmarks: number = 50
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get the Twitter connection
    const connection = await getTwitterConnection(userId);

    if (!connection) {
      result.errors.push("Twitter not connected");
      return result;
    }

    if (!connection.syncEnabled) {
      result.errors.push("Twitter sync is disabled");
      return result;
    }

    // Fetch bookmarks from Twitter
    console.log(`Fetching Twitter bookmarks for user ${userId}...`);
    const response = await fetchBookmarks(connection, undefined, maxBookmarks);

    console.log(`Found ${response.bookmarks.length} bookmarks`);

    // Process each bookmark
    for (const bookmark of response.bookmarks) {
      // Check if already imported
      const alreadyImported = await isBookmarkImported(userId, bookmark.id);

      if (alreadyImported) {
        result.skipped++;
        continue;
      }

      // Import the bookmark
      const importResult = await importBookmark(userId, bookmark);

      if (importResult.success) {
        result.synced++;
      } else {
        result.failed++;
        if (importResult.error) {
          result.errors.push(
            `Bookmark ${bookmark.id}: ${importResult.error}`
          );
        }
      }

      // Small delay between imports to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Update the last sync timestamp
    await prisma.socialConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncCursor: response.bookmarks[0]?.id, // Most recent bookmark ID
      },
    });

    result.success = true;
    console.log(
      `Twitter sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error("Twitter sync failed:", error);
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
    return result;
  }
}

/**
 * Get sync status for a user's Twitter connection
 */
export async function getTwitterSyncStatus(userId: string) {
  const connection = await getTwitterConnection(userId);

  if (!connection) {
    return {
      connected: false,
      lastSync: null,
      syncEnabled: false,
    };
  }

  // Count items imported from Twitter
  const importedCount = await prisma.item.count({
    where: {
      userId,
      importSource: "twitter",
    },
  });

  return {
    connected: true,
    handle: connection.providerHandle,
    lastSync: connection.lastSyncAt,
    syncEnabled: connection.syncEnabled,
    importedCount,
  };
}
