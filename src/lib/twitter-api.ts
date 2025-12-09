/**
 * Twitter/X API Service
 * Handles fetching bookmarks and managing API interactions
 */

import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/twitter-oauth";
import type { SocialConnection } from "@/generated/prisma";

// Twitter API v2 base URL
const TWITTER_API_BASE = "https://api.twitter.com/2";

// Tweet fields to request
const TWEET_FIELDS = [
  "id",
  "text",
  "created_at",
  "author_id",
  "public_metrics",
  "entities",
  "attachments",
].join(",");

// Expansions to include author info and media
const EXPANSIONS = ["author_id", "attachments.media_keys"].join(",");

// User fields to include
const USER_FIELDS = ["id", "name", "username", "profile_image_url"].join(",");

// Media fields to include (add alt_text/size for better coverage)
const MEDIA_FIELDS = [
  "media_key",
  "type",
  "url",
  "preview_image_url",
  "alt_text",
  "width",
  "height",
].join(",");

export interface TwitterBookmark {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    username: string;
    profileImageUrl?: string;
  };
  media?: {
    type: string;
    url?: string;
    previewImageUrl?: string;
  }[];
  url: string;
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

export interface BookmarksResponse {
  bookmarks: TwitterBookmark[];
  nextToken?: string;
  hasMore: boolean;
}

/**
 * Ensure the access token is valid, refresh if needed
 */
async function ensureValidToken(
  connection: SocialConnection,
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

  console.log(`Refreshed Twitter token for connection ${connection.id}`);

  return {
    accessToken: tokenResponse.access_token,
    updated: true,
  };
}

/**
 * Fetch bookmarks from Twitter API
 */
export async function fetchBookmarks(
  connection: SocialConnection,
  paginationToken?: string,
  maxResults: number = 100,
): Promise<BookmarksResponse> {
  // Ensure we have a valid access token
  const { accessToken } = await ensureValidToken(connection);

  // Build URL with query parameters
  const url = new URL(
    `${TWITTER_API_BASE}/users/${connection.providerUserId}/bookmarks`,
  );
  url.searchParams.set("tweet.fields", TWEET_FIELDS);
  url.searchParams.set("expansions", EXPANSIONS);
  url.searchParams.set("user.fields", USER_FIELDS);
  url.searchParams.set("media.fields", MEDIA_FIELDS);
  url.searchParams.set("max_results", String(Math.min(maxResults, 100)));

  if (paginationToken) {
    url.searchParams.set("pagination_token", paginationToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter API error:", response.status, errorText);

    if (response.status === 401) {
      throw new Error("Twitter authentication expired");
    }
    if (response.status === 429) {
      throw new Error("Twitter rate limit exceeded");
    }

    throw new Error(`Twitter API error: ${response.status}`);
  }

  const data = await response.json();

  // Parse the response
  const tweets = data.data || [];
  const includes = data.includes || {};
  const users = includes.users || [];
  const media = includes.media || [];

  // Define types for Twitter API response objects
  interface TwitterApiUser {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  }

  interface TwitterApiMedia {
    media_key: string;
    type: string;
    url?: string;
    preview_image_url?: string;
    variants?: Array<{
      url?: string;
      preview_image_url?: string;
    }>;
  }

  // Create lookup maps
  const userMap = new Map<string, TwitterApiUser>(
    users.map((u: TwitterApiUser) => [u.id, u]),
  );
  const mediaMap = new Map<string, TwitterApiMedia>(
    media.map((m: TwitterApiMedia) => [m.media_key, m]),
  );

  // Transform tweets to our format
  const bookmarks: TwitterBookmark[] = tweets.map((tweet: any) => {
    const author = userMap.get(tweet.author_id);
    const tweetMedia = tweet.attachments?.media_keys
      ?.map((key: string) => mediaMap.get(key))
      .filter(Boolean);

    const normalizedMedia =
      tweetMedia?.map((m: TwitterApiMedia) => {
        // Prefer direct image url; fallback to preview or variant previews
        const variantPreview =
          m.variants?.find((v) => v.preview_image_url)?.preview_image_url ||
          m.variants?.find((v) => v.url)?.url;
        return {
          type: m.type,
          url: m.url,
          previewImageUrl: m.preview_image_url || variantPreview,
        };
      }) || [];

    return {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      authorId: tweet.author_id,
      author: author
        ? {
            id: author.id,
            name: author.name,
            username: author.username,
            profileImageUrl: author.profile_image_url,
          }
        : undefined,
      media: normalizedMedia,
      url: `https://x.com/${author?.username || "i"}/status/${tweet.id}`,
      metrics: tweet.public_metrics
        ? {
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
          }
        : undefined,
    };
  });

  return {
    bookmarks,
    nextToken: data.meta?.next_token,
    hasMore: !!data.meta?.next_token,
  };
}

/**
 * Fetch all bookmarks since a certain cursor (for incremental sync)
 */
export async function fetchAllBookmarksSince(
  connection: SocialConnection,
  sinceId?: string,
  maxBookmarks: number = 500,
): Promise<TwitterBookmark[]> {
  const allBookmarks: TwitterBookmark[] = [];
  let nextToken: string | undefined;
  let reachedSinceId = false;

  while (allBookmarks.length < maxBookmarks && !reachedSinceId) {
    const response = await fetchBookmarks(connection, nextToken);

    for (const bookmark of response.bookmarks) {
      // Stop if we've reached the bookmark we've already synced
      if (sinceId && bookmark.id === sinceId) {
        reachedSinceId = true;
        break;
      }
      allBookmarks.push(bookmark);
    }

    if (!response.hasMore) {
      break;
    }

    nextToken = response.nextToken;

    // Small delay to be respectful of rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allBookmarks;
}

/**
 * Get the Twitter connection for a user
 */
export async function getTwitterConnection(
  userId: string,
): Promise<SocialConnection | null> {
  return prisma.socialConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "twitter",
      },
    },
  });
}

/**
 * Disconnect Twitter (revoke and delete connection)
 */
export async function disconnectTwitter(userId: string): Promise<void> {
  const connection = await getTwitterConnection(userId);

  if (!connection) {
    return;
  }

  try {
    // Revoke the token with Twitter
    const { revokeToken } = await import("@/lib/twitter-oauth");
    const accessToken = decryptToken(connection.accessToken);
    await revokeToken(accessToken);
  } catch (error) {
    console.error("Failed to revoke Twitter token:", error);
    // Continue with deletion even if revocation fails
  }

  // Delete the connection from our database
  await prisma.socialConnection.delete({
    where: { id: connection.id },
  });

  console.log(`Twitter disconnected for user ${userId}`);
}
