"use client";

import { SWRConfig } from "swr";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import type { ReactNode } from "react";

// Global fetcher with explicit no-store to avoid browser-level caching across users
async function fetcher(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch");
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

  // Create a dedicated cache map per user
  const cache = useMemo(() => new Map(), [userId]);
  const swrKey = userId ?? "guest";

  return (
    <SWRConfig
      key={swrKey}
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
