"use client";

import { useTodaySidebar } from "@/hooks/use-today-sidebar";
import { UserProfileSection } from "./UserProfileSection";
import { QuickStats } from "./QuickStats";
import { SourceBreakdown } from "./SourceBreakdown";
import { AlertCircle } from "lucide-react";

/**
 * Skeleton loading state for sidebar
 */
function SidebarSkeleton() {
  return (
    <div className="sticky top-20 space-y-3 animate-pulse">
      {/* Profile Card Skeleton */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-14 bg-muted rounded" />
          <div className="w-full h-2 bg-muted rounded" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <div className="h-3 w-16 bg-muted rounded mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Sources Skeleton */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <div className="h-3 w-24 bg-muted rounded mb-2" />
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Error state for sidebar
 */
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="sticky top-20">
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
              Failed to load sidebar
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main sidebar component for the Today page
 * Displays user profile summary and content source statistics
 */
export function TodaySidebar() {
  const { stats, sources, isLoading, error } = useTodaySidebar();

  // Loading state
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // No data state (shouldn't happen if authenticated)
  if (!stats) {
    return null;
  }

  return (
    <div className="sticky top-20 space-y-3">
      {/* User Profile Card */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <UserProfileSection
          level={stats.level}
          totalXp={stats.totalXp}
          levelProgress={stats.levelProgress}
        />
      </div>

      {/* Quick Stats Card */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-foreground mb-2">
          Quick Stats
        </h3>
        <QuickStats
          itemsSaved={stats.itemsSaved}
          itemsProcessed={stats.itemsProcessed}
          currentStreak={stats.currentStreak}
        />
      </div>

      {/* Content Sources Card */}
      <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-foreground mb-2">
          Content Sources
        </h3>
        <SourceBreakdown sources={sources} />
      </div>
    </div>
  );
}
