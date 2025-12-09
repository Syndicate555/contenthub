import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schema for setting focus areas
const SetFocusAreasSchema = z.object({
  domainIds: z
    .array(z.string())
    .min(1, "Select at least 1 focus area")
    .max(3, "Maximum 3 focus areas allowed"),
});

// GET /api/user/focus-areas - Get user's current focus areas
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's focus areas with domain details
    const focusAreas = await db.focusArea.findMany({
      where: { userId: user.id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          focusAreas: focusAreas.map((fa) => ({
            id: fa.id,
            priority: fa.priority,
            domain: fa.domain,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/user/focus-areas error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch focus areas" },
      { status: 500 },
    );
  }
}

// POST /api/user/focus-areas - Set user's focus areas (replaces existing)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = SetFocusAreasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { domainIds } = parsed.data;

    // Verify all domain IDs exist
    const domains = await db.domain.findMany({
      where: { id: { in: domainIds } },
      select: { id: true },
    });

    if (domains.length !== domainIds.length) {
      return NextResponse.json(
        { ok: false, error: "One or more invalid domain IDs" },
        { status: 400 },
      );
    }

    // Delete existing focus areas and create new ones in a transaction
    await db.$transaction(async (tx) => {
      // Delete all existing focus areas for this user
      await tx.focusArea.deleteMany({
        where: { userId: user.id },
      });

      // Create new focus areas with priority based on order
      await tx.focusArea.createMany({
        data: domainIds.map((domainId, index) => ({
          userId: user.id,
          domainId,
          priority: index + 1, // 1, 2, 3
        })),
      });
    });

    // Fetch the newly created focus areas
    const focusAreas = await db.focusArea.findMany({
      where: { userId: user.id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      ok: true,
      data: {
        focusAreas: focusAreas.map((fa) => ({
          id: fa.id,
          priority: fa.priority,
          domain: fa.domain,
        })),
      },
    });
  } catch (error) {
    console.error("POST /api/user/focus-areas error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to set focus areas" },
      { status: 500 },
    );
  }
}
