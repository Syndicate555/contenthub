/**
 * Pinterest Sync Service
 * Syncs Pinterest pins to ContentHub items through the processing pipeline
 */

import { prisma } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import {
  fetchBoardPins,
  fetchBoards,
  getPinterestConnection,
  type PinterestPin,
} from "@/lib/pinterest-api";

export interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface SyncOptions {
  maxPins?: number;
  selectedBoards?: string[]; // null = all boards
}

/**
 * Check if a pin has already been imported
 */
async function isPinImported(
  userId: string,
  externalId: string,
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: {
      userId,
      importSource: "pinterest",
      externalId,
    },
  });
  return !!existing;
}

/**
 * Import a single Pinterest pin as an item
 */
async function importPin(
  userId: string,
  pin: PinterestPin,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for duplicate
    const alreadyImported = await isPinImported(userId, pin.id);
    if (alreadyImported) {
      return { success: true }; // Skip silently
    }

    // Determine target URL
    // Prefer external link (destination), fallback to Pinterest URL
    const targetUrl = pin.link || pin.pinUrl;

    // Create note with context
    const note = pin.boardName
      ? `Pinterest pin from "${pin.boardName}"`
      : "Pinterest pin";

    // Process through pipeline
    const result = await processItem({
      url: targetUrl,
      note,
      userId,
    });

    // Prepare import metadata
    const importMetadata = {
      boardId: pin.boardId,
      boardName: pin.boardName || "Unknown",
      pinUrl: pin.pinUrl,
      mediaUrl: pin.mediaUrl,
      isImageOnly: pin.isImageOnly,
      destinationUrl: pin.link,
      altText: pin.altText,
    };

    if (!result.success) {
      // Even if processing fails, update with Pinterest metadata
      await prisma.item.update({
        where: { id: result.item.id },
        data: {
          importSource: "pinterest",
          externalId: pin.id,
          imageUrl: pin.mediaUrl || result.item.imageUrl,
          importMetadata,
        },
      });
      return {
        success: false,
        error: result.error || "Processing failed",
      };
    }

    // Update item with Pinterest metadata
    // Use Pinterest image if better than extracted
    await prisma.item.update({
      where: { id: result.item.id },
      data: {
        importSource: "pinterest",
        externalId: pin.id,
        imageUrl: pin.mediaUrl || result.item.imageUrl,
        importMetadata,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to import pin ${pin.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync Pinterest pins for a user
 */
export async function syncPinterestPins(
  userId: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { maxPins = 50, selectedBoards } = options;

  const result: SyncResult = {
    success: false,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get connection
    const connection = await getPinterestConnection(userId);

    if (!connection) {
      result.errors.push("Pinterest not connected");
      return result;
    }

    if (!connection.syncEnabled) {
      result.errors.push("Pinterest sync is disabled");
      return result;
    }

    // Get boards to sync
    console.log(`Fetching Pinterest boards for user ${userId}...`);
    const allBoards = await fetchBoards(connection);

    const boardsToSync = selectedBoards
      ? allBoards.filter((b) => selectedBoards.includes(b.id))
      : allBoards;

    if (boardsToSync.length === 0) {
      result.errors.push("No boards to sync");
      return result;
    }

    console.log(
      `Syncing ${boardsToSync.length} boards (max ${maxPins} pins)...`,
    );

    let totalPinsProcessed = 0;

    // Fetch pins from each board
    for (const board of boardsToSync) {
      if (totalPinsProcessed >= maxPins) break;

      console.log(`Fetching pins from board: ${board.name}`);

      const pinsResponse = await fetchBoardPins(
        connection,
        board.id,
        board.name,
        undefined,
        Math.min(25, maxPins - totalPinsProcessed),
      );

      // Process pins
      for (const pin of pinsResponse.pins) {
        if (totalPinsProcessed >= maxPins) break;

        // Check if already imported
        const alreadyImported = await isPinImported(userId, pin.id);

        if (alreadyImported) {
          result.skipped++;
          totalPinsProcessed++;
          continue;
        }

        // Import pin
        const importResult = await importPin(userId, pin);

        if (importResult.success) {
          result.synced++;
        } else {
          result.failed++;
          if (importResult.error) {
            result.errors.push(`Pin ${pin.id}: ${importResult.error}`);
          }
        }

        totalPinsProcessed++;

        // Rate limit delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Small delay between boards
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update last sync
    await prisma.socialConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
      },
    });

    result.success = true;
    console.log(
      `Pinterest sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`,
    );

    return result;
  } catch (error) {
    console.error("Pinterest sync failed:", error);
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error",
    );
    return result;
  }
}

/**
 * Get sync status for Pinterest connection
 */
export async function getPinterestSyncStatus(userId: string) {
  const connection = await getPinterestConnection(userId);

  if (!connection) {
    return {
      connected: false,
      lastSync: null,
      syncEnabled: false,
    };
  }

  // Count items imported from Pinterest
  const importedCount = await prisma.item.count({
    where: {
      userId,
      importSource: "pinterest",
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
