/**
 * Pinterest OAuth 2.0 Authorization Initiation
 * GET /api/auth/pinterest - Redirects to Pinterest's authorization page
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateState,
  buildAuthorizationUrl,
  getPinterestRedirectUri,
} from "@/lib/pinterest-oauth";

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

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("pinterest_oauth_state", state, COOKIE_OPTIONS);

    // Build and redirect to Pinterest's authorization URL
    const redirectUri = getPinterestRedirectUri();
    const authorizationUrl = buildAuthorizationUrl(redirectUri, state);

    console.log(`Initiating Pinterest OAuth for user ${userId}`);

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
