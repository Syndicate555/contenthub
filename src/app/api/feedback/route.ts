import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const feedbackSchema = z.object({
  kind: z.enum(["feedback", "support"]),
  type: z.string().min(1),
  area: z.string().optional(),
  severity: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  body: z.string().min(10),
  allowFollowUp: z.boolean().optional().default(false),
  contactEmail: z.string().email(),
  route: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = feedbackSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    // Basic rate limit: max 5 submissions per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await db.feedback.count({
      where: { userId: user.id, createdAt: { gt: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const created = await db.feedback.create({
      data: {
        userId: user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ ok: true, data: { id: created.id } });
  } catch (error) {
    console.error("POST /api/feedback error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
