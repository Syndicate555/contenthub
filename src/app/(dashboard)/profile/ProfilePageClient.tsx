"use client";

import { lazy, Suspense } from "react";
import { Trophy, TrendingUp, Flame, Target } from "lucide-react";
import { DomainStats } from "./components/DomainStats";
import { StatsCard } from "./components/StatsCard";
import { useProfileData } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakWarning } from "@/components/streak-warning";
import { StreakCalendar } from "@/components/streak-calendar";

// Lazy load below-the-fold components for faster initial render
const RecentActivity = lazy(() =>
  import("./components/RecentActivity").then((mod) => ({
    default: mod.RecentActivity,
  })),
);
const BadgeShowcase = lazy(() =>
  import("./components/BadgeShowcase").then((mod) => ({
    default: mod.BadgeShowcase,
  })),
);
const QuestsPreview = lazy(() =>
  import("./components/QuestsPreview").then((mod) => ({
    default: mod.QuestsPreview,
  })),
);

interface UserStats {
  totalXp: number;
  level: number;
  itemsSaved: number;
  itemsProcessed: number;
  reflections: number;
  questsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date | null;
  levelProgress: {
    currentLevel: number;
    nextLevelXp: number;
    xpNeeded: number;
    progress: number;
  };
}

interface UserDomain {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  totalXp: number;
  level: number;
  itemCount: number;
  levelProgress: {
    currentLevel: number;
    nextLevelXp: number;
    xpNeeded: number;
    progress: number;
  };
}

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  awardedAt: string;
}

interface XPEvent {
  id: string;
  action: string;
  xpAmount: number;
  createdAt: string;
  domain?: {
    displayName: string;
    icon: string;
    color: string;
  };
}

interface ProfilePageClientProps {
  fallbackData?: any;
}

export function ProfilePageClient({ fallbackData }: ProfilePageClientProps) {
  // Use SWR hook with optional server-rendered fallback data
  const {
    stats,
    domains,
    recentActivity,
    earnedBadges,
    allBadges,
    badgeStats,
    isLoading,
    error,
    mutate,
  } = useProfileData(fallbackData);

  // Show loading only if we have nothing cached to render
  const hasData = !!stats;

  if (isLoading && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-foreground border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 font-medium">
            {error || "Failed to load profile"}
          </p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Level {stats.level}</h1>
            <p className="text-gray-300 text-sm">
              {stats.totalXp.toLocaleString()} Total XP
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{stats.itemsProcessed}</div>
            <div className="text-xs text-gray-300">Items Processed</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Level {stats.levelProgress.currentLevel}</span>
            <span className="text-gray-300">
              {stats.levelProgress.xpNeeded} XP to Level{" "}
              {stats.levelProgress.currentLevel + 1}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.levelProgress.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-300 mt-1 text-right">
            {stats.levelProgress.progress}% complete
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label="Badges Earned"
          value={earnedBadges.length}
          trend={badgeStats ? `${badgeStats.progress}%` : "0%"}
        />
        <StatsCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          trend={
            stats.longestStreak > 0 ? `Best: ${stats.longestStreak}` : undefined
          }
        />
        <StatsCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Items Saved"
          value={stats.itemsSaved}
        />
        <StatsCard
          icon={<Target className="w-5 h-5 text-purple-500" />}
          label="Reflections"
          value={stats.reflections}
        />
      </div>

      {/* Streak Warning */}
      <StreakWarning />

      {/* Usage streak heatmap (full width) */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
        <StreakCalendar days={180} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Domain Stats, Badges & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <DomainStats domains={domains} />

          {/* Lazy load badges (below the fold) */}
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <BadgeShowcase
              badges={allBadges}
              badgeStats={badgeStats}
              userStats={stats}
            />
          </Suspense>
        </div>

        {/* Right Column - Activity & Quests */}
        <div className="space-y-6">
          {/* Lazy load activity feed (below the fold) */}
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <RecentActivity events={recentActivity} />
          </Suspense>

          {/* Lazy load quests (below the fold) */}
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
            <QuestsPreview />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
