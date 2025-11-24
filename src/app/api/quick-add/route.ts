import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processItem } from "@/lib/pipeline";
import { quickAddSchema } from "@/lib/schemas";

// POST /api/quick-add - Quick add from mobile shortcuts (bearer token auth)
export async function POST(request: NextRequest) {
  try {
    // Validate bearer token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.QUICK_ADD_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Invalid or missing authorization" },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = quickAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // For quick-add, we need to find the default user
    // Since this is a single-user app, get the first user
    const user = await db.user.findFirst();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No user found. Please sign in to the web app first." },
        { status: 404 }
      );
    }

    // Process the item
    const result = await processItem({
      url: parsed.data.url,
      note: parsed.data.note,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      itemId: result.item.id,
      title: result.item.title,
      source: result.item.source,
    });
  } catch (error) {
    console.error("POST /api/quick-add error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to add item" },
      { status: 500 }
    );
  }
}
