/**
 * Pinterest OAuth 2.0 Callback Handler
 * GET /api/auth/pinterest/callback - Handles OAuth callback from Pinterest
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
  PINTEREST_SCOPES,
} from "@/lib/pinterest-oauth";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated with Clerk
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.redirect(
        new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL),
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle Pinterest authorization errors
    if (error) {
      console.error("Pinterest OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/settings?error=pinterest_auth_denied&message=${encodeURIComponent(
            errorDescription || error,
          )}`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/settings?error=missing_params",
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Verify state from cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get("pinterest_oauth_state")?.value;

    // Clear OAuth cookie
    cookieStore.delete("pinterest_oauth_state");

    if (!storedState || state !== storedState) {
      console.error("State mismatch:", {
        received: state,
        stored: storedState,
      });
      return NextResponse.redirect(
        new URL(
          "/settings?error=state_mismatch",
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Exchange code for tokens
    const redirectUri = getPinterestRedirectUri();
    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    // Get Pinterest user info
    const pinterestUser = await getPinterestUser(tokenResponse.access_token);

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/settings?error=user_not_found",
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Calculate token expiration time
    const tokenExpiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000,
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
        scopes: PINTEREST_SCOPES,
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
        scopes: PINTEREST_SCOPES,
      },
    });

    console.log(
      `Pinterest connected for user ${user.id}: @${pinterestUser.username}`,
    );

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL(
        `/settings?success=pinterest_connected&handle=${encodeURIComponent(
          pinterestUser.username,
        )}`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
  } catch (error) {
    console.error("Pinterest OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings?error=callback_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error",
        )}`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
  }
}
