# Pinterest Integration - Detailed Implementation Plan

## Executive Summary

This plan outlines the implementation of Pinterest integration for ContentHub, following the established Twitter integration pattern. The implementation will enable users to sync their saved Pinterest pins, process them through the existing AI pipeline, and manage them alongside other content.

## Analysis of Existing Patterns

### Twitter Integration Pattern (Blueprint)

The Twitter integration provides an excellent template with the following architecture:

**1. OAuth Layer (`twitter-oauth.ts`)**
- PKCE-enabled OAuth 2.0 flow
- Token management (access, refresh, revoke)
- State validation for CSRF protection
- Encrypted token storage

**2. API Client (`twitter-api.ts`)**
- Connection management
- Token refresh logic with expiry checking (5-minute threshold)
- API fetching with pagination support
- Error handling for 401 (auth), 429 (rate limit), etc.
- Data normalization

**3. Sync Service (`twitter-sync.ts`)**
- Duplicate detection via `externalId` + `importSource`
- Integration with `processItem` pipeline
- Media URL handling with fallbacks
- Sync result tracking
- Rate limit friendly delays

**4. API Routes**
- `GET /api/auth/twitter` - OAuth initiation
- `GET /api/auth/twitter/callback` - OAuth callback
- `POST /api/connections/twitter` - Trigger sync
- `DELETE /api/connections/twitter` - Disconnect

**5. UI Integration**
- Platform configuration in `PLATFORMS` map
- Connection status display
- Sync/disconnect actions
- Success/error notifications

### Key Patterns to Replicate

✅ **Security**: Encrypted tokens, CSRF protection, secure cookies
✅ **Reliability**: Token refresh, retry logic, graceful error handling
✅ **User Experience**: Clear status messages, progress tracking
✅ **Data Integrity**: Deduplication, atomic operations
✅ **Code Quality**: TypeScript strict mode, consistent error types

---

## Pinterest API Deep Dive

### OAuth 2.0 Flow

Pinterest uses OAuth 2.0 Authorization Code flow similar to Twitter:

- **Authorization Endpoint**: `https://www.pinterest.com/oauth/`
- **Token Endpoint**: `https://api.pinterest.com/v5/oauth/token`
- **Required Scopes**:
  - `boards:read` - Read board information
  - `pins:read` - Read pins (includes saved pins)
  - `user_accounts:read` - Read user profile

**Key Differences from Twitter**:
- Pinterest uses standard OAuth 2.0 (not necessarily PKCE, but we can implement it if supported)
- Refresh tokens are supported
- Token expiry: typically 30 days (vs Twitter's 2 hours)

### API Endpoints

```
Base URL: https://api.pinterest.com/v5

User Info:
GET /user_account
Response: { username, account_type, profile_image, id }

List Boards:
GET /boards?page_size=25&bookmark={cursor}
Response: { items: [...], bookmark }

Board Pins:
GET /boards/{board_id}/pins?page_size=25&bookmark={cursor}
Response: { items: [...], bookmark }

Pin Detail (if needed):
GET /pins/{pin_id}
Response: { id, title, description, link, media, board_id, created_at }
```

### Pin Object Structure

```typescript
interface PinterestPin {
  id: string;
  created_at: string;
  link?: string; // Destination URL (may be null for image-only pins)
  title?: string;
  description?: string;
  alt_text?: string;
  board_id: string;
  board_section_id?: string;
  media: {
    media_type: 'image' | 'video';
    images?: {
      '150x150'?: { url: string };
      '400x300'?: { url: string };
      '600x'?: { url: string };
      '1200x'?: { url: string };
      'originals'?: { url: string };
    };
  };
  pin_metrics?: {
    saves: number;
  };
}

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy: 'PUBLIC' | 'PROTECTED' | 'SECRET';
  pin_count?: number;
}
```

### Rate Limits

- **200 requests per hour** for read endpoints
- Pagination: 25-100 items per page (default: 25)
- Recommended: 100ms delay between requests

---

## Database Schema Changes

### Option 1: Add `importMetadata` to Item (Recommended)

```prisma
model Item {
  // ... existing fields ...

  // NEW: Store provider-specific metadata as JSON
  importMetadata Json?    // Pinterest: { boardId, boardName, pinUrl, mediaUrl, isImageOnly, ... }
}
```

**Benefits**:
- Flexible schema for different providers
- No migration complexity
- Easy to query and display provider-specific data

**Pinterest Metadata Structure**:
```typescript
interface PinterestImportMetadata {
  boardId: string;
  boardName: string;
  pinUrl: string;          // https://pinterest.com/pin/{pin_id}
  mediaUrl?: string;       // Original Pinterest image
  isImageOnly: boolean;    // true if pin has no external link
  destinationUrl?: string; // External link if available
  altText?: string;
  saveCount?: number;
}
```

### Option 2: Add `syncPreferences` to SocialConnection

```prisma
model SocialConnection {
  // ... existing fields ...

  // NEW: Provider-specific sync preferences
  syncPreferences Json?   // Pinterest: { selectedBoards: [...], perBoardCursors: {...} }
  scopes          String[] // For auditing granted scopes
}
```

**Pinterest Sync Preferences**:
```typescript
interface PinterestSyncPreferences {
  selectedBoards?: string[];           // null = all boards
  perBoardCursors?: Record<string, string>; // For board-level incremental sync
  maxPinsPerSync?: number;            // Default: 50
}
```

### Migration Plan

```bash
# Generate migration
npx prisma migrate dev --name add_pinterest_metadata

# Regenerate Prisma client
npx prisma generate
```

---

## Implementation Checklist

### Phase 1: Foundation (OAuth & API Client)

#### 1.1 Environment Configuration

**File**: `.env.example` update

```bash
# Pinterest OAuth Configuration
PINTEREST_CLIENT_ID=your_pinterest_app_id
PINTEREST_CLIENT_SECRET=your_pinterest_app_secret
# Redirect URI will be: {NEXT_PUBLIC_APP_URL}/api/auth/pinterest/callback
```

**Documentation**: Update README or create `docs/pinterest-setup.md`

```markdown
## Pinterest Integration Setup

1. Create Pinterest App: https://developers.pinterest.com/apps/
2. Configure Redirect URI: `{YOUR_DOMAIN}/api/auth/pinterest/callback`
3. Request scopes: `boards:read`, `pins:read`, `user_accounts:read`
4. Add credentials to `.env`
```

#### 1.2 Pinterest OAuth Helper

**File**: `src/lib/pinterest-oauth.ts`

```typescript
/**
 * Pinterest OAuth 2.0 utilities
 * Implements Authorization Code Flow with state validation
 */

import * as crypto from "crypto";

// Pinterest OAuth endpoints
export const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";
export const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
export const PINTEREST_REVOKE_URL = "https://api.pinterest.com/v5/oauth/revoke";

// Required scopes
export const PINTEREST_SCOPES = [
  "boards:read",
  "pins:read",
  "user_accounts:read",
];

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface PinterestUser {
  id: string;
  username: string;
  account_type: string;
  profile_image?: string;
}

/**
 * Generate random state for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Build authorization URL
 */
export function buildAuthorizationUrl(
  redirectUri: string,
  state: string
): string {
  const clientId = process.env.PINTEREST_CLIENT_ID;

  if (!clientId) {
    throw new Error("PINTEREST_CLIENT_ID environment variable is not set");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: PINTEREST_SCOPES.join(","), // Pinterest uses comma-separated scopes
    state: state,
  });

  return `${PINTEREST_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pinterest client credentials not configured");
  }

  const response = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinterest token exchange failed:", errorText);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pinterest client credentials not configured");
  }

  const response = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinterest token refresh failed:", errorText);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pinterest client credentials not configured");
  }

  await fetch(PINTEREST_REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      access_token: token,
    }).toString(),
  });
}

/**
 * Get authenticated user's Pinterest profile
 */
export async function getPinterestUser(
  accessToken: string
): Promise<PinterestUser> {
  const response = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to get Pinterest user:", errorText);
    throw new Error(`Failed to get Pinterest user: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    account_type: data.account_type,
    profile_image: data.profile_image,
  };
}

/**
 * Get the redirect URI for OAuth callback
 */
export function getPinterestRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/pinterest/callback`;
}
```

**Key Design Decisions**:
- ✅ No PKCE (Pinterest doesn't require it, but we use state for CSRF)
- ✅ Basic Auth for token endpoints (Pinterest standard)
- ✅ Comma-separated scopes (Pinterest convention)
- ✅ Same error handling pattern as Twitter

#### 1.3 Pinterest API Client

**File**: `src/lib/pinterest-api.ts`

```typescript
/**
 * Pinterest API Service
 * Handles fetching boards and pins
 */

import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/pinterest-oauth";
import type { SocialConnection } from "@/generated/prisma";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// Rate limit: 200 requests per hour
const RATE_LIMIT_DELAY_MS = 100; // 100ms between requests

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
    return {
      accessToken: decryptToken(connection.accessToken),
      updated: false,
    };
  }

  // Refresh token
  if (!connection.refreshToken) {
    throw new Error("No refresh token available");
  }

  const decryptedRefreshToken = decryptToken(connection.refreshToken);
  const tokenResponse = await refreshAccessToken(decryptedRefreshToken);

  const newExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  const encryptedAccessToken = encryptToken(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encryptToken(tokenResponse.refresh_token)
    : connection.refreshToken;

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
 * Fetch user's boards
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

    const data = await response.json();

    allBoards.push(
      ...data.items.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.description,
        privacy: board.privacy,
        pinCount: board.pin_count,
      }))
    );

    bookmark = data.bookmark;

    // Rate limit friendly delay
    if (bookmark) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  } while (bookmark);

  return allBoards;
}

/**
 * Fetch pins from a specific board
 */
export async function fetchBoardPins(
  connection: SocialConnection,
  boardId: string,
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

  const data = await response.json();

  // Get board name for metadata
  const boardsData = await fetch(
    `${PINTEREST_API_BASE}/boards/${boardId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  ).then(r => r.json());

  const boardName = boardsData?.name || "Unknown Board";

  // Normalize pins
  const pins: PinterestPin[] = data.items.map((pin: any) => {
    const mediaUrl =
      pin.media?.images?.originals?.url ||
      pin.media?.images?.["1200x"]?.url ||
      pin.media?.images?.["600x"]?.url;

    return {
      id: pin.id,
      title: pin.title,
      description: pin.description,
      link: pin.link || undefined,
      altText: pin.alt_text,
      createdAt: pin.created_at,
      boardId: pin.board_id,
      boardName,
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
 * Disconnect Pinterest (revoke and delete)
 */
export async function disconnectPinterest(userId: string): Promise<void> {
  const connection = await getPinterestConnection(userId);

  if (!connection) {
    return;
  }

  try {
    const { revokeToken } = await import("@/lib/pinterest-oauth");
    const accessToken = decryptToken(connection.accessToken);
    await revokeToken(accessToken);
  } catch (error) {
    console.error("Failed to revoke Pinterest token:", error);
    // Continue with deletion
  }

  await prisma.socialConnection.delete({
    where: { id: connection.id },
  });

  console.log(`Pinterest disconnected for user ${userId}`);
}
```

**Key Features**:
- ✅ Token refresh with 5-minute buffer
- ✅ Rate limit delays (100ms between requests)
- ✅ Pagination handling for boards and pins
- ✅ Image URL prioritization (originals → 1200x → 600x)
- ✅ Proper error handling (401, 429, etc.)

### Phase 2: Sync Service & Content Processing

#### 2.1 Pinterest Sync Service

**File**: `src/lib/pinterest-sync.ts`

```typescript
/**
 * Pinterest Sync Service
 * Syncs Pinterest pins to ContentHub items
 */

import { prisma } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import {
  fetchBoardPins,
  fetchBoards,
  getPinterestConnection,
  type PinterestPin,
} from "@/lib/pinterest-api";
import type { SocialConnection } from "@/generated/prisma";

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
  externalId: string
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
  pin: PinterestPin
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
  options: SyncOptions = {}
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

    console.log(`Syncing ${boardsToSync.length} boards...`);

    let totalPinsProcessed = 0;

    // Fetch pins from each board
    for (const board of boardsToSync) {
      if (totalPinsProcessed >= maxPins) break;

      console.log(`Fetching pins from board: ${board.name}`);

      const pinsResponse = await fetchBoardPins(
        connection,
        board.id,
        undefined,
        Math.min(25, maxPins - totalPinsProcessed)
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
      `Pinterest sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error("Pinterest sync failed:", error);
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
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
```

**Key Decisions**:
- ✅ Multi-board sync with configurable selection
- ✅ Prefer external link over Pinterest URL for processing
- ✅ Store rich metadata in `importMetadata` field
- ✅ 500ms delay between pin imports (respectful rate limiting)
- ✅ Max pins cap (default 50) to control costs

#### 2.2 Content Extraction Enhancement

**File**: `src/lib/extractor.ts` (update)

Add Pinterest-specific handling to avoid scraping Pinterest's login wall:

```typescript
// Add to extractContent function

// Special handling for Pinterest URLs
if (url.includes('pinterest.com/pin/')) {
  // Don't scrape Pinterest itself - metadata comes from API
  console.log('Skipping Pinterest URL scraping (using API metadata)');
  return {
    title: 'Pinterest Pin',
    content: '',
    source: 'pinterest.com',
  };
}
```

**Reasoning**: Pinterest URLs require login, and we already have metadata from the API. This prevents wasted scraping attempts.

### Phase 3: API Routes

#### 3.1 OAuth Initiation

**File**: `src/app/api/auth/pinterest/route.ts`

```typescript
/**
 * Pinterest OAuth Initiation
 * GET /api/auth/pinterest - Redirects to Pinterest authorization
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateState,
  buildAuthorizationUrl,
  getPinterestRedirectUri,
} from "@/lib/pinterest-oauth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 10, // 10 minutes
  path: "/",
};

export async function GET() {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("pinterest_oauth_state", state, COOKIE_OPTIONS);

    // Build and redirect to Pinterest
    const redirectUri = getPinterestRedirectUri();
    const authorizationUrl = buildAuthorizationUrl(redirectUri, state);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Pinterest OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings?error=oauth_init_failed",
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
```

#### 3.2 OAuth Callback

**File**: `src/app/api/auth/pinterest/callback/route.ts`

```typescript
/**
 * Pinterest OAuth Callback Handler
 * GET /api/auth/pinterest/callback
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/encryption";
import {
  exchangeCodeForToken,
  getPinterestUser,
  getPinterestRedirectUri,
} from "@/lib/pinterest-oauth";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.redirect(
        new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle authorization errors
    if (error) {
      console.error("Pinterest OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/settings?error=pinterest_auth_denied&message=${encodeURIComponent(
            errorDescription || error
          )}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/settings?error=missing_params",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("pinterest_oauth_state")?.value;

    cookieStore.delete("pinterest_oauth_state");

    if (!storedState || state !== storedState) {
      console.error("State mismatch:", { received: state, stored: storedState });
      return NextResponse.redirect(
        new URL(
          "/settings?error=state_mismatch",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Exchange code for tokens
    const redirectUri = getPinterestRedirectUri();
    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    // Get Pinterest user info
    const pinterestUser = await getPinterestUser(tokenResponse.access_token);

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/settings?error=user_not_found",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000
    );

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null;

    // Upsert social connection
    await prisma.socialConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "pinterest",
        },
      },
      update: {
        providerUserId: pinterestUser.id,
        providerHandle: pinterestUser.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncEnabled: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        provider: "pinterest",
        providerUserId: pinterestUser.id,
        providerHandle: pinterestUser.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncEnabled: true,
      },
    });

    console.log(
      `Pinterest connected for user ${user.id}: @${pinterestUser.username}`
    );

    // Redirect with success
    return NextResponse.redirect(
      new URL(
        `/settings?success=pinterest_connected&handle=${encodeURIComponent(
          pinterestUser.username
        )}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (error) {
    console.error("Pinterest OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings?error=callback_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
```

#### 3.3 Connection Management Routes

**File**: `src/app/api/connections/pinterest/route.ts`

```typescript
/**
 * Pinterest Connection API
 * POST /api/connections/pinterest - Trigger sync
 * DELETE /api/connections/pinterest - Disconnect
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncPinterestPins } from "@/lib/pinterest-sync";
import { disconnectPinterest } from "@/lib/pinterest-api";

/**
 * POST - Trigger Pinterest sync
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Trigger sync
    const result = await syncPinterestPins(user.id);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: result.errors[0],
          data: result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("Error syncing Pinterest:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync Pinterest pins" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Disconnect Pinterest
 */
export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    await disconnectPinterest(user.id);

    return NextResponse.json({
      ok: true,
      message: "Pinterest disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Pinterest:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect Pinterest" },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/connections/pinterest/boards/route.ts` (Optional - for board selection UI)

```typescript
/**
 * Pinterest Boards API
 * GET /api/connections/pinterest/boards - List user's boards
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchBoards } from "@/lib/pinterest-api";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const connection = await prisma.socialConnection.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "pinterest",
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { ok: false, error: "Pinterest not connected" },
        { status: 404 }
      );
    }

    const boards = await fetchBoards(connection);

    return NextResponse.json({
      ok: true,
      data: { boards },
    });
  } catch (error) {
    console.error("Error fetching Pinterest boards:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}
```

### Phase 4: UI Integration

#### 4.1 Settings Page Update

**File**: `src/app/(dashboard)/settings/SettingsPageClient.tsx` (update)

Add Pinterest to the `PLATFORMS` configuration:

```typescript
const PLATFORMS = {
  twitter: {
    name: "Twitter / X",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "bg-black",
    connectPath: "/api/auth/twitter",
    description: "Import your bookmarked tweets",
  },
  pinterest: {
    name: "Pinterest",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
    ),
    color: "bg-red-600",
    connectPath: "/api/auth/pinterest",
    description: "Import your saved pins",
  },
};
```

Update success message handling:

```typescript
useEffect(() => {
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const handle = searchParams.get("handle");
  const message = searchParams.get("message");

  if (success === "twitter_connected") {
    setNotification({
      type: "success",
      message: handle
        ? `Successfully connected @${handle}`
        : "Twitter connected successfully",
    });
    window.history.replaceState({}, "", "/settings");
  } else if (success === "pinterest_connected") {
    setNotification({
      type: "success",
      message: handle
        ? `Successfully connected Pinterest (@${handle})`
        : "Pinterest connected successfully",
    });
    window.history.replaceState({}, "", "/settings");
  } else if (error) {
    setNotification({
      type: "error",
      message: message || `Connection failed: ${error}`,
    });
    window.history.replaceState({}, "", "/settings");
  }
}, [searchParams]);
```

#### 4.2 Platform Icon Mapping

Update files that display platform icons (e.g., Today sidebar, Items list):

**Pattern to follow**:

```typescript
const PLATFORM_ICONS = {
  twitter: <TwitterIcon />,
  pinterest: <PinterestIcon />,
  email: <MailIcon />,
  // ... other platforms
};

const PLATFORM_COLORS = {
  twitter: "text-black",
  pinterest: "text-red-600",
  email: "text-blue-500",
};
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/unit/pinterest-oauth.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { generateState, buildAuthorizationUrl } from '@/lib/pinterest-oauth';

describe('Pinterest OAuth', () => {
  it('generates random state', () => {
    const state1 = generateState();
    const state2 = generateState();

    expect(state1).toHaveLength(32);
    expect(state1).not.toBe(state2);
  });

  it('builds valid authorization URL', () => {
    const state = 'test_state';
    const redirectUri = 'http://localhost:3000/callback';

    const url = buildAuthorizationUrl(redirectUri, state);

    expect(url).toContain('pinterest.com/oauth');
    expect(url).toContain(`state=${state}`);
    expect(url).toContain('boards:read');
    expect(url).toContain('pins:read');
  });
});
```

### Integration Tests

**File**: `tests/integration/pinterest-sync.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { syncPinterestPins } from '@/lib/pinterest-sync';
import { mockPinterestAPI } from '../mocks/pinterest';

describe('Pinterest Sync', () => {
  beforeEach(() => {
    mockPinterestAPI.reset();
  });

  it('syncs pins successfully', async () => {
    mockPinterestAPI.mockBoards([{ id: 'board1', name: 'Test Board' }]);
    mockPinterestAPI.mockPins('board1', [
      { id: 'pin1', link: 'https://example.com' },
      { id: 'pin2', link: null }, // Image-only pin
    ]);

    const result = await syncPinterestPins('user_123');

    expect(result.success).toBe(true);
    expect(result.synced).toBe(2);
  });

  it('handles duplicate pins', async () => {
    // Setup: pin1 already exists in DB

    const result = await syncPinterestPins('user_123');

    expect(result.skipped).toBeGreaterThan(0);
  });

  it('handles rate limits gracefully', async () => {
    mockPinterestAPI.simulateRateLimit();

    const result = await syncPinterestPins('user_123');

    expect(result.errors).toContain('rate limit');
  });
});
```

### Manual Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens are encrypted in database
- [ ] Token refresh works before expiry
- [ ] Pins with external links process correctly
- [ ] Image-only pins create items with Pinterest URL
- [ ] Images from Pinterest API are stored
- [ ] Duplicate pins are skipped
- [ ] Sync shows correct counts (synced/skipped/failed)
- [ ] Disconnect revokes tokens and removes connection
- [ ] Settings UI shows connection status
- [ ] Today page shows Pinterest icon for pins
- [ ] Board names appear in item metadata

---

## Deployment Checklist

### Environment Setup

```bash
# Production environment variables
PINTEREST_CLIENT_ID=prod_client_id
PINTEREST_CLIENT_SECRET=prod_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key

# Pinterest App Configuration
# Redirect URI: https://yourdomain.com/api/auth/pinterest/callback
```

### Database Migration

```bash
# Run migration
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

### Monitoring

Add logging for:
- OAuth success/failure rates
- Sync completion times
- API error rates (401, 429, 500)
- Average pins per sync
- Image extraction success rate

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Board Selection UI**
   - Modal to select specific boards to sync
   - Store preferences in `syncPreferences`
   - Display selected boards on settings card

2. **Incremental Sync**
   - Store per-board cursors
   - Only fetch new pins since last sync
   - Reduce API calls and processing time

3. **Scheduled Auto-Sync**
   - Background job (BullMQ) to sync daily
   - Configurable sync frequency
   - Email notifications for new pins

4. **Pinterest Collections**
   - Support for Pinterest board sections
   - Organize items by collections

5. **Rich Pin Metadata**
   - Store pin creator info
   - Display save counts
   - Link to original pinner

---

## Open Questions & Decisions

### 1. Board Selection: Required or Optional?

**Options**:
- **A**: Default to all boards, allow opt-out
- **B**: Require board selection before first sync
- **C**: Start with all boards, add selection UI later

**Recommendation**: **Option A** (default all boards)
- Simplest UX for MVP
- Matches Twitter pattern (all bookmarks)
- Can add granular control in Phase 2

### 2. Sync Frequency

**Options**:
- **A**: Manual sync only (MVP)
- **B**: Manual + scheduled auto-sync
- **C**: Real-time webhook-based sync

**Recommendation**: **Option A** (manual only)
- Simplest implementation
- Pinterest API limits make real-time impractical
- Can add background jobs later

### 3. Max Pins Per Sync

**Options**:
- **A**: 50 pins (conservative, cost-effective)
- **B**: 100 pins (balanced)
- **C**: Unlimited (user-configurable)

**Recommendation**: **Option A** (50 pins default)
- Controls OpenAI API costs
- Prevents long-running syncs
- Can make configurable later

### 4. Image-Only Pin Handling

When a pin has no external link:

**Options**:
- **A**: Process Pinterest URL (may hit login wall)
- **B**: Use Vision API with pin image
- **C**: Create minimal item with title/description only

**Recommendation**: **Option C** for MVP, **Option B** for enhancement
- Avoids wasted scraping attempts
- Vision API adds cost but provides value
- Can implement Vision as Phase 2 feature

---

## Success Metrics

### MVP Acceptance Criteria

- [ ] OAuth flow completes in <30 seconds
- [ ] 50 pins sync in <5 minutes
- [ ] <5% failure rate for pins with valid links
- [ ] Zero token leaks or security vulnerabilities
- [ ] Settings UI shows accurate connection status
- [ ] Duplicate pins are 100% deduplicated

### Quality Metrics

- **Code Coverage**: >80%
- **TypeScript Errors**: 0
- **ESLint Warnings**: 0
- **Performance**: Sync 50 pins in <300 seconds
- **Reliability**: <1% auth token refresh failures

---

## Risk Mitigation

### Risk 1: Pinterest API Changes

**Mitigation**:
- Version API calls (`/v5`)
- Monitor Pinterest developer changelog
- Implement graceful degradation
- Log API responses for debugging

### Risk 2: Rate Limiting

**Mitigation**:
- 100ms delays between requests
- Exponential backoff on 429 errors
- Cap max pins per sync
- Display clear error messages

### Risk 3: Image-Only Pins

**Mitigation**:
- Fallback to Pinterest URL
- Store rich metadata for display
- Consider Vision API integration
- Clear labeling in UI

### Risk 4: Cost Explosion

**Mitigation**:
- Cap pins per sync (50 default)
- Skip already-imported pins early
- Monitor OpenAI API usage
- Rate limit per-user syncs

---

## Conclusion

This implementation plan provides a comprehensive, production-ready Pinterest integration that:

✅ Follows established patterns from Twitter integration
✅ Maintains security best practices (encrypted tokens, CSRF protection)
✅ Handles edge cases (image-only pins, rate limits, token refresh)
✅ Provides excellent UX (clear status, error handling, notifications)
✅ Controls costs (sync caps, deduplication, selective syncing)
✅ Enables future enhancements (board selection, auto-sync, Vision API)

The phased approach allows for rapid MVP delivery while leaving room for sophisticated features in future iterations.
