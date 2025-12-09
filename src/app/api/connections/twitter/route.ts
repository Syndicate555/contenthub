/**
 * Twitter Connection API
 * POST /api/connections/twitter/sync - Trigger bookmark sync
 * DELETE /api/connections/twitter - Disconnect Twitter
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncTwitterBookmarks } from "@/lib/twitter-sync";
import { disconnectTwitter } from "@/lib/twitter-api";

/**
 * POST - Trigger a sync of Twitter bookmarks
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Trigger sync
    const result = await syncTwitterBookmarks(user.id);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: result.errors[0],
          data: result,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("Error syncing Twitter:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync Twitter bookmarks" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Disconnect Twitter account
 */
export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Disconnect Twitter
    await disconnectTwitter(user.id);

    return NextResponse.json({
      ok: true,
      message: "Twitter disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Twitter:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect Twitter" },
      { status: 500 },
    );
  }
}
