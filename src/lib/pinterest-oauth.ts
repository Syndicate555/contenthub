/**
 * Pinterest OAuth 2.0 utilities
 * Implements Authorization Code Flow with state validation
 */

import * as crypto from "crypto";

// Pinterest OAuth endpoints
export const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";
export const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
export const PINTEREST_REVOKE_URL = "https://api.pinterest.com/v5/oauth/revoke";

// Required scopes for Pinterest API access
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
 * Build authorization URL for Pinterest OAuth
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

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
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

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
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

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  await fetch(PINTEREST_REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
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
