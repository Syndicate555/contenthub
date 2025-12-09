/**
 * Pinterest Connection API
 * POST /api/connections/pinterest - Trigger Pinterest sync
 * DELETE /api/connections/pinterest - Disconnect Pinterest
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncPinterestPins } from "@/lib/pinterest-sync";
import { disconnectPinterest } from "@/lib/pinterest-api";

/**
 * POST - Trigger a sync of Pinterest pins
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
    console.log(`Starting Pinterest sync for user ${user.id}`);
    const result = await syncPinterestPins(user.id);

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
    console.error("Error syncing Pinterest:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync Pinterest pins" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Disconnect Pinterest account
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

    // Disconnect Pinterest
    console.log(`Disconnecting Pinterest for user ${user.id}`);
    await disconnectPinterest(user.id);

    return NextResponse.json({
      ok: true,
      message: "Pinterest disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Pinterest:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect Pinterest" },
      { status: 500 },
    );
  }
}
