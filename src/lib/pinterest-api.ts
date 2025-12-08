/**
 * Pinterest API Service
 * Handles fetching boards and pins with pagination and token management
 */

import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/pinterest-oauth";
import type { SocialConnection } from "@/generated/prisma";

// Pinterest API base URL
const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// Rate limit: 200 requests per hour for read endpoints
// Recommended delay: 100ms between requests
const RATE_LIMIT_DELAY_MS = 100;

// Pinterest API response types
interface PinterestApiBoardResponse {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    privacy: string;
    pin_count?: number;
  }>;
  bookmark?: string;
}

interface PinterestApiPinResponse {
  items: Array<{
    id: string;
    title?: string;
    description?: string;
    link?: string;
    alt_text?: string;
    created_at: string;
    board_id?: string;
    media?: {
      images?: {
        originals?: { url: string };
        "1200x"?: { url: string };
        "600x"?: { url: string };
        "400x300"?: { url: string };
      };
    };
  }>;
  bookmark?: string;
}

export interface PinterestPin {
  id: string;
  title?: string;
  description?: string;
  link?: string; // External destination URL
  altText?: string;
  createdAt: string;
  boardId: string;
  boardName?: string;
  mediaUrl?: string; // Best available image
  pinUrl: string; // Pinterest URL
  isImageOnly: boolean;
}

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  pinCount?: number;
}

export interface PinsResponse {
  pins: PinterestPin[];
  bookmark?: string;
  hasMore: boolean;
}

/**
 * Ensure access token is valid, refresh if needed
 */
async function ensureValidToken(
  connection: SocialConnection
): Promise<{ accessToken: string; updated: boolean }> {
  const now = new Date();
  const tokenExpiry = connection.tokenExpiresAt;

  // Check if token is expired or will expire in the next 5 minutes
  const isExpired =
    !tokenExpiry || tokenExpiry.getTime() < now.getTime() + 5 * 60 * 1000;

  if (!isExpired) {
    // Token is still valid
    return {
      accessToken: decryptToken(connection.accessToken),
      updated: false,
    };
  }

  // Need to refresh the token
  if (!connection.refreshToken) {
    throw new Error("No refresh token available");
  }

  const decryptedRefreshToken = decryptToken(connection.refreshToken);
  const tokenResponse = await refreshAccessToken(decryptedRefreshToken);

  // Calculate new expiry time
  const newExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // Encrypt new tokens
  const encryptedAccessToken = encryptToken(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encryptToken(tokenResponse.refresh_token)
    : connection.refreshToken; // Keep old refresh token if new one not provided

  // Update connection in database
  await prisma.socialConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    },
  });

  console.log(`Refreshed Pinterest token for connection ${connection.id}`);

  return {
    accessToken: tokenResponse.access_token,
    updated: true,
  };
}

/**
 * Fetch user's boards with pagination
 */
export async function fetchBoards(
  connection: SocialConnection
): Promise<PinterestBoard[]> {
  const { accessToken } = await ensureValidToken(connection);

  const allBoards: PinterestBoard[] = [];
  let bookmark: string | undefined;

  do {
    const url = new URL(`${PINTEREST_API_BASE}/boards`);
    url.searchParams.set("page_size", "25");
    if (bookmark) {
      url.searchParams.set("bookmark", bookmark);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinterest boards API error:", response.status, errorText);

      if (response.status === 401) {
        throw new Error("Pinterest authentication expired");
      }
      if (response.status === 429) {
        throw new Error("Pinterest rate limit exceeded");
      }

      throw new Error(`Pinterest API error: ${response.status}`);
    }

    const data: PinterestApiBoardResponse = await response.json();

    // Add boards to collection
    if (data.items && Array.isArray(data.items)) {
      allBoards.push(
        ...data.items.map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          privacy: board.privacy,
          pinCount: board.pin_count,
        }))
      );
    }

    bookmark = data.bookmark;

    // Rate limit friendly delay
    if (bookmark) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  } while (bookmark);

  console.log(`Fetched ${allBoards.length} boards for connection ${connection.id}`);

  return allBoards;
}

/**
 * Fetch pins from a specific board
 */
export async function fetchBoardPins(
  connection: SocialConnection,
  boardId: string,
  boardName?: string,
  bookmark?: string,
  pageSize: number = 25
): Promise<PinsResponse> {
  const { accessToken } = await ensureValidToken(connection);

  const url = new URL(`${PINTEREST_API_BASE}/boards/${boardId}/pins`);
  url.searchParams.set("page_size", String(Math.min(pageSize, 100)));
  if (bookmark) {
    url.searchParams.set("bookmark", bookmark);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinterest pins API error:", response.status, errorText);

    if (response.status === 401) {
      throw new Error("Pinterest authentication expired");
    }
    if (response.status === 429) {
      throw new Error("Pinterest rate limit exceeded");
    }

    throw new Error(`Pinterest API error: ${response.status}`);
  }

  const data: PinterestApiPinResponse = await response.json();

  // If board name not provided, fetch it
  let resolvedBoardName = boardName;
  if (!resolvedBoardName && data.items && data.items.length > 0) {
    try {
      const boardResponse = await fetch(
        `${PINTEREST_API_BASE}/boards/${boardId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (boardResponse.ok) {
        const boardData: { name: string } = await boardResponse.json();
        resolvedBoardName = boardData.name;
      }
    } catch (error) {
      console.warn("Failed to fetch board name:", error);
      resolvedBoardName = "Unknown Board";
    }
  }

  // Normalize pins
  const pins: PinterestPin[] = (data.items || []).map((pin) => {
    // Extract best available image
    const mediaUrl =
      pin.media?.images?.originals?.url ||
      pin.media?.images?.["1200x"]?.url ||
      pin.media?.images?.["600x"]?.url ||
      pin.media?.images?.["400x300"]?.url;

    return {
      id: pin.id,
      title: pin.title,
      description: pin.description,
      link: pin.link || undefined,
      altText: pin.alt_text,
      createdAt: pin.created_at,
      boardId: pin.board_id || boardId,
      boardName: resolvedBoardName || "Unknown Board",
      mediaUrl,
      pinUrl: `https://www.pinterest.com/pin/${pin.id}/`,
      isImageOnly: !pin.link,
    };
  });

  return {
    pins,
    bookmark: data.bookmark,
    hasMore: !!data.bookmark,
  };
}

/**
 * Get Pinterest connection for a user
 */
export async function getPinterestConnection(
  userId: string
): Promise<SocialConnection | null> {
  return prisma.socialConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "pinterest",
      },
    },
  });
}

/**
 * Disconnect Pinterest (revoke and delete connection)
 */
export async function disconnectPinterest(userId: string): Promise<void> {
  const connection = await getPinterestConnection(userId);

  if (!connection) {
    return;
  }

  try {
    // Revoke the token with Pinterest
    const { revokeToken } = await import("@/lib/pinterest-oauth");
    const accessToken = decryptToken(connection.accessToken);
    await revokeToken(accessToken);
    console.log(`Pinterest token revoked for user ${userId}`);
  } catch (error) {
    console.error("Failed to revoke Pinterest token:", error);
    // Continue with deletion even if revocation fails
  }

  // Delete the connection from our database
  await prisma.socialConnection.delete({
    where: { id: connection.id },
  });

  console.log(`Pinterest disconnected for user ${userId}`);
}
