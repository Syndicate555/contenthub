/**
 * Pinterest Boards API
 * GET /api/connections/pinterest/boards - List user's Pinterest boards
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchBoards } from "@/lib/pinterest-api";

/**
 * GET - List user's Pinterest boards for selection
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get Pinterest connection
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

    // Fetch boards from Pinterest
    console.log(`Fetching boards for user ${user.id}`);
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
