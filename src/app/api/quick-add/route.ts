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
        { status: 401 },
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = quickAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // For quick-add, we need to find the default user
    // Since this is a single-user app, get the first user
    const user = await db.user.findFirst();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "No user found. Please sign in to the web app first.",
        },
        { status: 404 },
      );
    }

    // Prevent writes in demo mode
    try {
      const { assertNotDemoUser } = await import("@/lib/auth");
      await assertNotDemoUser(user);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Demo mode is read-only. Sign in to save changes.",
        },
        { status: 403 },
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
      newBadges: result.newBadges,
    });
  } catch (error) {
    console.error("POST /api/quick-add error:", error);

    // Return user-friendly error message from pipeline validation
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process this URL. Please check the URL and try again.";

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 400 }, // Use 400 for validation errors, not 500
    );
  }
}
