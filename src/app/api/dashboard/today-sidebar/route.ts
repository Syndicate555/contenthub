import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStats } from "@/lib/xp";
import { db } from "@/lib/db";

/**
 * Map source domains to friendly display names and icons
 */
function mapSourceToDisplay(source: string): { displayName: string; icon: string } {
  const lowerSource = source.toLowerCase();

  // Handle common platforms
  if (lowerSource.includes("twitter.com") || lowerSource.includes("x.com")) {
    return { displayName: "Twitter", icon: "𝕏" };
  }
  if (lowerSource.includes("linkedin.com")) {
    return { displayName: "LinkedIn", icon: "💼" };
  }
  if (lowerSource.includes("instagram.com")) {
    return { displayName: "Instagram", icon: "📸" };
  }
  if (lowerSource.includes("youtube.com")) {
    return { displayName: "YouTube", icon: "▶️" };
  }
  if (lowerSource.includes("medium.com")) {
    return { displayName: "Medium", icon: "📝" };
  }
  if (lowerSource.includes("github.com")) {
    return { displayName: "GitHub", icon: "🐙" };
  }
  if (lowerSource.includes("reddit.com")) {
    return { displayName: "Reddit", icon: "👽" };
  }
  if (lowerSource.includes("substack.com")) {
    return { displayName: "Substack", icon: "📬" };
  }

  // Extract domain name for unknown sources
  try {
    const domain = source.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    const displayName = domain.split(".")[0];
    return {
      displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      icon: "🌐",
    };
  } catch {
    return { displayName: source, icon: "🌐" };
  }
}

/**
 * GET /api/dashboard/today-sidebar
 * Returns user profile summary and content source statistics for the today page sidebar
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch stats and source breakdown in parallel
    const [stats, sourceStats] = await Promise.all([
      getUserStats(user.id),
      db.item.groupBy({
        by: ["source"],
        where: {
          userId: user.id,
          status: "new",
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
    ]);

    // Map sources to display format
    const sources = sourceStats.map((stat) => {
      const { displayName, icon } = mapSourceToDisplay(stat.source);
      return {
        source: stat.source,
        displayName,
        icon,
        count: stat._count.id,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          stats: {
            totalXp: stats.totalXp,
            level: stats.overallLevel,
            levelProgress: stats.levelProgress,
            itemsSaved: stats.itemsSaved,
            itemsProcessed: stats.itemsProcessed,
            currentStreak: stats.currentStreak,
          },
          sources,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/dashboard/today-sidebar error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch sidebar data" },
      { status: 500 }
    );
  }
}
