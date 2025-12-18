import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateItemSchema } from "@/lib/schemas";
import { assignTagsToItem, removeTagsFromItem } from "@/lib/tags/service";
import { normalizeTag, isValidTag } from "@/lib/tags/normalize";

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

    // Handle status changes that affect tag counts
    if (parsed.data.status !== undefined) {
      const oldStatus = item.status;
      const newStatus = parsed.data.status;

      updateData.status = newStatus;

      // Set reviewedAt when marking as reviewed or pinned
      if (newStatus === "reviewed" || newStatus === "pinned") {
        updateData.reviewedAt = new Date();
      }

      // NOTE: Tag usageCount is now calculated dynamically per-user in the API
      // No need to update denormalized counts when item status changes
    }

    if (parsed.data.note !== undefined) {
      updateData.note = parsed.data.note;
    }

    // Handle tags separately with validation and transaction
    if (parsed.data.tags !== undefined) {
      // Validate all tags
      const invalidTags = parsed.data.tags.filter(
        (tag) => !isValidTag(normalizeTag(tag)),
      );

      if (invalidTags.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Invalid tags: ${invalidTags.join(", ")}`,
          },
          { status: 400 },
        );
      }

      // Update tags in transaction
      await db.$transaction(async (tx) => {
        // Remove existing tags
        await removeTagsFromItem(tx, id);

        // Assign new tags
        if (parsed.data.tags && parsed.data.tags.length > 0) {
          await assignTagsToItem(tx, id, parsed.data.tags);
        }
      });

      // Also update legacy tags field for backward compatibility
      updateData.tags = parsed.data.tags;
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
