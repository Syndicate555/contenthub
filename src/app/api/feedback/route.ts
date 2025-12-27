import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  logRateLimitViolation,
  getEndpointId,
} from "@/lib/rate-limit-helpers";

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

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const endpoint = getEndpointId(request);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check rate limit: 5/hour per user
    const rateLimitResult = await checkRateLimit({
      identifier: user.id,
      endpoint,
      limits: {
        perHour: 5,
      },
      metadata: {
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (!rateLimitResult.success) {
      await logRateLimitViolation(
        user.id,
        ipAddress,
        endpoint,
        request.headers.get("user-agent"),
      );
      return createRateLimitResponse(rateLimitResult);
    }

    const json = await request.json();
    const parsed = feedbackSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    const created = await db.feedback.create({
      data: {
        userId: user.id,
        ...parsed.data,
      },
    });

    const response = NextResponse.json({ ok: true, data: { id: created.id } });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("POST /api/feedback error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
