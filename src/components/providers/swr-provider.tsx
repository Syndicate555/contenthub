"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

// Global fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error || "API error");
  }

  return json;
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // Stale-while-revalidate: show cached data immediately, revalidate in background
        revalidateOnFocus: false, // Don't refetch on window focus (prevents unnecessary requests)
        revalidateOnReconnect: true, // Refetch when network reconnects
        revalidateIfStale: true, // Use stale data while revalidating
        dedupingInterval: 5000, // Dedupe requests within 5 seconds
        errorRetryCount: 2, // Retry failed requests twice
        errorRetryInterval: 3000, // Wait 3 seconds between retries
        keepPreviousData: true, // Keep previous data while loading new data (prevents flash)
        // Cache data for 5 minutes by default
        refreshInterval: 0, // Don't auto-refresh (manual control)
        // Suspense mode disabled for more control
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
