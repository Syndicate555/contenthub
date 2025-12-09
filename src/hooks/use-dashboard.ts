"use client";

import useSWR, { mutate } from "swr";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

// Persist freshness across unmounts per user to avoid refetching on quick tab flips
const profileFreshness = new Map<string, number>();
const PROFILE_CACHE_KEY = "/api/dashboard/profile";
const settingsFreshness = new Map<string, number>();
const SETTINGS_CACHE_KEY = "/api/dashboard/settings";

/**
 * Hook to fetch all Profile page data in one request
 * REBUILT FROM SCRATCH - Simple, clean approach
 */
export function useProfileData(fallbackData?: unknown) {
  const { isLoaded, userId } = useAuth();

  // Allow fetch only when auth is ready
  const shouldFetch = isLoaded && userId;

  // Treat data as fresh for 30s per user to avoid refetch on rapid tab switches
  const lastResolved = userId ? profileFreshness.get(userId) : null;
  const isFresh = lastResolved != null && Date.now() - lastResolved < 30_000;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    shouldFetch ? PROFILE_CACHE_KEY : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // If we already have data and it's fresh, skip revalidate on mount/stale
      revalidateOnMount: !isFresh,
      revalidateIfStale: !isFresh,
      fallbackData,
    },
  );

  // Update freshness marker whenever we have data
  useEffect(() => {
    if (userId && data?.data) {
      profileFreshness.set(userId, Date.now());
    }
  }, [data, userId]);

  return {
    stats: data?.data?.stats,
    domains: data?.data?.domains || [],
    recentActivity: data?.data?.recentActivity || [],
    earnedBadges: data?.data?.earnedBadges || [],
    allBadges: data?.data?.allBadges || [],
    badgesByRarity: data?.data?.badgesByRarity,
    badgeStats: data?.data?.badgeStats,
    isLoading: !shouldFetch || (isLoading && !data && !fallbackData),
    isValidating,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch all Settings page data in one request
 * REBUILT FROM SCRATCH - Simple, clean approach
 */
export function useSettingsData(fallbackData?: unknown) {
  const { isLoaded, userId } = useAuth();

  // Simple approach: only fetch if auth is ready
  const shouldFetch = isLoaded && userId;

  // Treat data as fresh for 30s per user to avoid refetch on rapid tab switches
  const lastResolved = userId ? settingsFreshness.get(userId) : null;
  const isFresh = lastResolved != null && Date.now() - lastResolved < 30_000;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    shouldFetch ? SETTINGS_CACHE_KEY : null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: !isFresh,
      revalidateOnReconnect: false,
      revalidateIfStale: !isFresh,
      fallbackData,
    },
  );

  useEffect(() => {
    if (userId && data?.data) {
      settingsFreshness.set(userId, Date.now());
    }
  }, [data, userId]);

  return {
    connections: data?.data?.connections || [],
    focusAreas: data?.data?.focusAreas || [],
    hasData: !!data?.data,
    isLoading: !shouldFetch || (isLoading && !data),
    isValidating,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Prefetch profile data for instant navigation
 */
export function prefetchProfileData() {
  mutate(PROFILE_CACHE_KEY, undefined, { revalidate: true });
}

/**
 * Prefetch settings data for instant navigation
 */
export function prefetchSettingsData() {
  mutate(SETTINGS_CACHE_KEY, undefined, { revalidate: true });
}
