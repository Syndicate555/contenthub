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
    <div className="sticky top-20 space-y-4 animate-pulse">
      {/* Profile Card Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="w-full h-2 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Sources Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              Failed to load sidebar
            </h3>
            <p className="text-xs text-red-700">{message}</p>
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
    <div className="sticky top-20 space-y-4">
      {/* User Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <UserProfileSection
          level={stats.level}
          totalXp={stats.totalXp}
          levelProgress={stats.levelProgress}
        />
      </div>

      {/* Quick Stats Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Quick Stats
        </h3>
        <QuickStats
          itemsSaved={stats.itemsSaved}
          itemsProcessed={stats.itemsProcessed}
          currentStreak={stats.currentStreak}
        />
      </div>

      {/* Content Sources Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Content Sources
        </h3>
        <SourceBreakdown sources={sources} />
      </div>
    </div>
  );
}
