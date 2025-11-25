import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getUserBadges, getAllBadges } from "@/lib/badges";

/**
 * GET /api/user/badges
 * Returns user's earned badges along with all available badges for progress tracking
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's earned badges
    const earnedBadges = await getUserBadges(user.id);

    // Get all available badges for progress tracking
    const allBadges = await getAllBadges();

    // Map earned badges for quick lookup
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));

    // Combine data: mark which badges are earned
    const badgesWithProgress = allBadges.map((badge) => {
      const earned = earnedBadges.find((eb) => eb.id === badge.id);

      return {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        domain: badge.domain,
        earned: !!earned,
        awardedAt: earned?.awardedAt || null,
      };
    });

    // Group badges by rarity for easier display
    const badgesByRarity = {
      common: badgesWithProgress.filter((b) => b.rarity === "common"),
      rare: badgesWithProgress.filter((b) => b.rarity === "rare"),
      epic: badgesWithProgress.filter((b) => b.rarity === "epic"),
      legendary: badgesWithProgress.filter((b) => b.rarity === "legendary"),
    };

    return NextResponse.json(
      {
        earnedBadges,
        allBadges: badgesWithProgress,
        badgesByRarity,
        stats: {
          total: allBadges.length,
          earned: earnedBadges.length,
          progress: Math.round((earnedBadges.length / allBadges.length) * 100),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
