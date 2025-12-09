import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateItemSchema } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/items/:id - Update item status, tags, or note
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Find the item and verify ownership
    const item = await db.item.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Item not found" },
        { status: 404 },
      );
    }

    if (item.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: {
      status?: string;
      tags?: string[];
      note?: string;
      reviewedAt?: Date;
    } = {};

    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
      // Set reviewedAt when marking as reviewed or pinned
      if (
        parsed.data.status === "reviewed" ||
        parsed.data.status === "pinned"
      ) {
        updateData.reviewedAt = new Date();
      }
    }

    if (parsed.data.tags !== undefined) {
      updateData.tags = parsed.data.tags;
    }

    if (parsed.data.note !== undefined) {
      updateData.note = parsed.data.note;
    }

    // Update the item
    const updatedItem = await db.item.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: updatedItem });
  } catch (error) {
    console.error("PATCH /api/items/:id error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update item" },
      { status: 500 },
    );
  }
}

// GET /api/items/:id - Get a single item
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const item = await db.item.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Item not found" },
        { status: 404 },
      );
    }

    if (item.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, data: item });
  } catch (error) {
    console.error("GET /api/items/:id error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch item" },
      { status: 500 },
    );
  }
}
