/**
 * Twitter OAuth 2.0 Callback Handler
 * GET /api/auth/twitter/callback - Handles OAuth callback from Twitter
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/encryption";
import {
  exchangeCodeForToken,
  getTwitterUser,
  getTwitterRedirectUri,
} from "@/lib/twitter-oauth";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated with Clerk
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

    // Handle Twitter authorization errors
    if (error) {
      console.error("Twitter OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/settings?error=twitter_auth_denied&message=${encodeURIComponent(
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

    // Verify state and get code verifier from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get("twitter_oauth_state")?.value;
    const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;

    // Clear OAuth cookies
    cookieStore.delete("twitter_oauth_state");
    cookieStore.delete("twitter_code_verifier");

    if (!storedState || state !== storedState) {
      console.error("State mismatch:", { received: state, stored: storedState });
      return NextResponse.redirect(
        new URL(
          "/settings?error=state_mismatch",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL(
          "/settings?error=missing_verifier",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Exchange code for tokens
    const redirectUri = getTwitterRedirectUri();
    const tokenResponse = await exchangeCodeForToken(
      code,
      codeVerifier,
      redirectUri
    );

    // Get Twitter user info
    const twitterUser = await getTwitterUser(tokenResponse.access_token);

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // This shouldn't happen if they're authenticated, but handle it
      return NextResponse.redirect(
        new URL(
          "/settings?error=user_not_found",
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Calculate token expiration time
    const tokenExpiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000
    );

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null;

    // Upsert the social connection
    await prisma.socialConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "twitter",
        },
      },
      update: {
        providerUserId: twitterUser.id,
        providerHandle: twitterUser.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncEnabled: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        provider: "twitter",
        providerUserId: twitterUser.id,
        providerHandle: twitterUser.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncEnabled: true,
      },
    });

    console.log(`Twitter connected for user ${user.id}: @${twitterUser.username}`);

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL(
        `/settings?success=twitter_connected&handle=${encodeURIComponent(
          twitterUser.username
        )}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (error) {
    console.error("Twitter OAuth callback error:", error);
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
