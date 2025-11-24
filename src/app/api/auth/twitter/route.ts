/**
 * Twitter OAuth 2.0 Authorization Initiation
 * GET /api/auth/twitter - Redirects to Twitter's authorization page
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  getTwitterRedirectUri,
} from "@/lib/twitter-oauth";

// Cookie settings for OAuth state
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 10, // 10 minutes
  path: "/",
};

export async function GET() {
  try {
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store PKCE verifier and state in HTTP-only cookies
    const cookieStore = await cookies();
    cookieStore.set("twitter_code_verifier", codeVerifier, COOKIE_OPTIONS);
    cookieStore.set("twitter_oauth_state", state, COOKIE_OPTIONS);

    // Build and redirect to Twitter's authorization URL
    const redirectUri = getTwitterRedirectUri();
    const authorizationUrl = buildAuthorizationUrl(
      redirectUri,
      state,
      codeChallenge
    );

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Twitter OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings?error=oauth_init_failed",
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
