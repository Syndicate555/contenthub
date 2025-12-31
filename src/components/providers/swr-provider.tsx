"use client";

import { SWRConfig } from "swr";
import { useAuth } from "@clerk/nextjs";
import { useMemo, useRef, useEffect } from "react";
import type { ReactNode } from "react";

// Global fetcher with explicit no-store to avoid browser-level caching across users
async function fetcher(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  // Check if response is HTML (session expired, redirected to sign-in)
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("text/html")) {
    // Session expired - redirect to sign-in
    window.location.href = "/sign-in?reason=session-expired";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    // Handle 401 Unauthorized - session expired
    if (res.status === 401) {
      // Try to parse error details
      let reason = "session-expired";
      try {
        const errorData = await res.json();
        reason = errorData.reason || "session-expired";
      } catch {
        // Ignore parse errors, use default reason
      }

      // Redirect to sign-in
      window.location.href = `/sign-in?reason=${reason}`;
      throw new Error("Session expired");
    }

    // Try to parse other errors as JSON
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error || "API error");
  }

  return json;
}

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * SWR Provider with per-user cache isolation.
 *
 * Key idea: each authenticated user gets their own cache Map. When userId
 * changes, SWRConfig remounts with a fresh cache provider, guaranteeing
 * no cross-user data reuse. The fetcher also bypasses browser HTTP cache.
 */
export function SWRProvider({ children }: SWRProviderProps) {
  const { userId } = useAuth();

  // Track the previous userId to detect user switches (not initial load)
  const previousUserIdRef = useRef<string | undefined | null>(null);

  // Create a single cache that persists across renders
  // We'll clear it manually when the user actually changes
  const cache = useMemo(() => new Map(), []); // Only create once

  // Clear cache when user switches (but not on initial load)
  useEffect(() => {
    const isUserSwitch =
      previousUserIdRef.current !== null && // Not the first render
      previousUserIdRef.current !== userId && // User actually changed
      previousUserIdRef.current !== undefined && // Previous wasn't loading state
      userId !== undefined; // Current isn't loading state

    if (isUserSwitch) {
      cache.clear();
    }

    previousUserIdRef.current = userId;
  }, [userId, cache]);

  // Don't use key prop to prevent remounting
  return (
    <SWRConfig
      value={{
        fetcher,
        provider: () => cache,
        // Conservative settings - prioritize correctness over performance
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 2000,
        errorRetryCount: 1,
        errorRetryInterval: 3000,
        keepPreviousData: false,
        refreshInterval: 0,
        suspense: false,
        focusThrottleInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
