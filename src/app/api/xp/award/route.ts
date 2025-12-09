import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  awardXP,
  XP_ACTIONS,
  XP_VALUES,
  isInFocusArea,
  type XPAction,
} from "@/lib/xp";

// Valid XP actions
const validActions = Object.values(XP_ACTIONS);

// Validation schema for awarding XP
const AwardXPSchema = z.object({
  action: z.enum(validActions as [string, ...string[]]),
  domainId: z.string().optional(),
  itemId: z.string().optional(),
  questId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/xp/award - Award XP to the current user
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
    const parsed = AwardXPSchema.safeParse(body);

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

    const { action, domainId, itemId, questId, metadata } = parsed.data;

    // Award base XP
    const result = await awardXP({
      userId: user.id,
      action: action as XPAction,
      domainId,
      itemId,
      questId,
      metadata,
    });

    // Check for focus area bonus (extra XP for items in focus areas)
    let focusAreaBonus = false;
    if (
      domainId &&
      (action === XP_ACTIONS.PROCESS_ITEM || action === XP_ACTIONS.SAVE_ITEM)
    ) {
      const inFocusArea = await isInFocusArea(user.id, domainId);
      if (inFocusArea) {
        // Award bonus XP for focus area
        await awardXP({
          userId: user.id,
          action: XP_ACTIONS.FOCUS_AREA_BONUS,
          domainId,
          itemId,
          metadata: { originalAction: action },
        });
        focusAreaBonus = true;
      }
    }

    const bonusXp = focusAreaBonus ? XP_VALUES[XP_ACTIONS.FOCUS_AREA_BONUS] : 0;

    return NextResponse.json({
      ok: true,
      data: {
        xpAwarded: result.xpAwarded + bonusXp,
        totalXp: result.totalXp + bonusXp,
        level: result.level,
        levelUp: result.levelUp,
        previousLevel: result.previousLevel,
        focusAreaBonus,
        bonusXp,
        domainXp: result.domainXp,
        domainLevel: result.domainLevel,
      },
    });
  } catch (error) {
    console.error("POST /api/xp/award error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to award XP" },
      { status: 500 },
    );
  }
}

// GET /api/xp/award - Get available XP actions and their values
export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      data: {
        actions: XP_ACTIONS,
        values: XP_VALUES,
      },
    });
  } catch (error) {
    console.error("GET /api/xp/award error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch XP actions" },
      { status: 500 },
    );
  }
}
