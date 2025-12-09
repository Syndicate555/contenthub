"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

// Persist freshness across unmounts per user to avoid refetching on quick tab flips
const sidebarFreshness = new Map<string, number>();

export interface TodaySidebarData {
  stats: {
    totalXp: number;
    level: number;
    levelProgress: {
      currentLevel: number;
      nextLevelXp: number;
      xpNeeded: number;
      progress: number;
    };
    itemsSaved: number;
    itemsProcessed: number;
    currentStreak: number;
  };
  sources: Array<{
    source: string;
    displayName: string;
    icon: string;
    count: number;
  }>;
}

/**
 * Hook to fetch today sidebar data (user stats + source breakdown)
 * Follows the pattern from useProfileData with freshness tracking
 */
export function useTodaySidebar() {
  const { isLoaded, userId } = useAuth();
  const url = "/api/dashboard/today-sidebar";

  // Allow fetch only when auth is ready
  const shouldFetch = isLoaded && userId;

  // Treat data as fresh for 30s per user to avoid refetch on rapid tab switches
  const lastResolved = userId ? sidebarFreshness.get(userId) : null;
  const isFresh = lastResolved != null && Date.now() - lastResolved < 30_000;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // If we already have data and it's fresh, skip revalidate on mount/stale
      revalidateOnMount: !isFresh,
      revalidateIfStale: !isFresh,
    },
  );

  // Update freshness marker whenever we have data
  useEffect(() => {
    if (userId && data?.data) {
      sidebarFreshness.set(userId, Date.now());
    }
  }, [data, userId]);

  return {
    stats: data?.data?.stats,
    sources: data?.data?.sources || [],
    isLoading: !shouldFetch || (isLoading && !data),
    isValidating,
    error: error?.message || null,
    mutate,
  };
}
