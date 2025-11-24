/**
 * Twitter/X OAuth 2.0 with PKCE utilities
 * Implements the OAuth 2.0 Authorization Code Flow with PKCE
 */

import crypto from "crypto";

// Twitter OAuth 2.0 endpoints
export const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
export const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
export const TWITTER_REVOKE_URL = "https://api.twitter.com/2/oauth2/revoke";

// Required scopes for bookmark access
export const TWITTER_SCOPES = [
  "bookmark.read",
  "tweet.read",
  "users.read",
  "offline.access", // Required for refresh tokens
];

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

/**
 * Generate a cryptographically random code verifier for PKCE
 * Must be 43-128 characters, URL-safe base64
 */
export function generateCodeVerifier(): string {
  const buffer = crypto.randomBytes(32);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate code challenge from verifier using SHA-256
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Build the Twitter OAuth authorization URL
 */
export function buildAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const clientId = process.env.TWITTER_CLIENT_ID;

  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID environment variable is not set");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: TWITTER_SCOPES.join(" "),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TWITTER_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitter client credentials not configured");
  }

  // Create Basic Auth header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token exchange failed:", errorText);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitter client credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TWITTER_TOKEN_URL, {
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
    console.error("Token refresh failed:", errorText);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Revoke an access token
 */
export async function revokeToken(token: string): Promise<void> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitter client credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  await fetch(TWITTER_REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      token: token,
    }).toString(),
  });
}

/**
 * Get the authenticated user's info from Twitter
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch("https://api.twitter.com/2/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to get Twitter user:", errorText);
    throw new Error(`Failed to get Twitter user: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get the redirect URI for the OAuth callback
 */
export function getTwitterRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/twitter/callback`;
}
