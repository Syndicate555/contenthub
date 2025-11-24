"use client";

import useSWR, { mutate } from "swr";
import { useRef, useMemo } from "react";
import type { Item } from "@/generated/prisma";
import type { ItemCategory, ItemStatus, PaginationMeta } from "@/types";

// API Response types
interface ItemsResponse {
  ok: boolean;
  data: Item[];
  meta: PaginationMeta;
}

interface CategoriesResponse {
  ok: boolean;
  data: {
    categories: CategoryData[];
    totalItems: number;
    platforms: { platform: string; count: number }[];
  };
}

export interface CategoryData {
  category: ItemCategory;
  label: string;
  icon: string;
  count: number;
  thumbnails: string[];
  titles: string[];
}

// Query params interface
export interface ItemsQueryParams {
  q?: string;
  status?: ItemStatus | "all";
  category?: ItemCategory | null;
  platform?: string | null;
  tag?: string | null;
  page?: number;
  limit?: number;
}

// Build URL with query params
function buildItemsUrl(params: ItemsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.category) searchParams.set("category", params.category);
  if (params.platform) searchParams.set("platform", params.platform);
  if (params.tag) searchParams.set("tag", params.tag);
  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 16));

  return `/api/items?${searchParams.toString()}`;
}

/**
 * Generate a stable filter key to detect when filters change significantly
 * This helps us know when to show loading vs stale data
 */
function getFilterKey(params: ItemsQueryParams): string {
  return JSON.stringify({
    q: params.q || "",
    status: params.status || "all",
    category: params.category || null,
    platform: params.platform || null,
    tag: params.tag || null,
  });
}

/**
 * Hook to fetch items with filters and pagination
 * Uses SWR for automatic caching and stale-while-revalidate
 *
 * KEY FIX: Detects when filters change and shows loading instead of stale data
 */
export function useItems(params: ItemsQueryParams = {}) {
  const url = buildItemsUrl(params);
  const currentFilterKey = getFilterKey(params);

  // Track which filter key the last successful data was from
  const lastSuccessfulFilterKeyRef = useRef<string | null>(null);

  const { data, error, isLoading, isValidating, mutate: mutateItems } = useSWR<ItemsResponse>(
    url,
    {
      // IMPORTANT: Don't keep previous data - it causes wrong data to flash
      // when switching between different filter states
      keepPreviousData: false,
      // Don't revalidate on focus for list views
      revalidateOnFocus: false,
      // Dedupe rapid requests
      dedupingInterval: 2000,
    }
  );

  // Update the ref when we get successful data
  if (data?.ok) {
    lastSuccessfulFilterKeyRef.current = currentFilterKey;
  }

  // Determine if the current data matches the current filter
  // This prevents showing stale data from a different filter
  const isDataStale = data && lastSuccessfulFilterKeyRef.current !== currentFilterKey;

  // Show loading when:
  // 1. SWR is loading (no cached data for this key)
  // 2. OR we have data but it's from a different filter key (stale)
  const showLoading = isLoading || isDataStale;

  return {
    items: showLoading ? [] : (data?.data || []),
    pagination: showLoading ? null : (data?.meta || null),
    isLoading: showLoading,
    isValidating,
    error: error?.message || null,
    mutate: mutateItems,
    // Expose the URL for cache invalidation
    cacheKey: url,
  };
}

/**
 * Hook to fetch "Today" items (new status)
 * This is a simpler case - no dynamic filters
 */
export function useTodayItems() {
  const { data, error, isLoading, isValidating, mutate: mutateItems } = useSWR<ItemsResponse>(
    "/api/items?status=new&limit=20",
    {
      // For Today view, we CAN use keepPreviousData since the query never changes
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    items: data?.data || [],
    isLoading: isLoading && !data,
    isValidating,
    error: error?.message || null,
    mutate: mutateItems,
  };
}

/**
 * Hook to fetch categories with counts and thumbnails
 * This is also a simpler case - no dynamic filters
 */
export function useCategories() {
  const { data, error, isLoading, isValidating, mutate: mutateCategories } = useSWR<CategoriesResponse>(
    "/api/categories",
    {
      // For categories, we CAN use keepPreviousData since the query never changes
      keepPreviousData: true,
      revalidateOnFocus: false,
      // Categories change less frequently, can be cached longer
      dedupingInterval: 10000,
    }
  );

  return {
    categories: data?.data?.categories || [],
    totalItems: data?.data?.totalItems || 0,
    platforms: data?.data?.platforms || [],
    isLoading: isLoading && !data,
    isValidating,
    error: error?.message || null,
    mutate: mutateCategories,
  };
}

/**
 * Update item status optimistically
 */
export async function updateItemStatus(
  itemId: string,
  newStatus: ItemStatus
): Promise<boolean> {
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Failed to update item");
    }

    // Revalidate all item-related caches
    // This will update both Today and Library views
    mutate((key) => typeof key === "string" && key.startsWith("/api/items"), undefined, {
      revalidate: true,
    });

    // Also revalidate categories (counts may have changed)
    mutate("/api/categories");

    return true;
  } catch (error) {
    console.error("Failed to update item status:", error);
    return false;
  }
}

/**
 * Prefetch data for instant navigation
 * Call this on hover/focus to preload data
 */
export function prefetchItems(params: ItemsQueryParams = {}) {
  const url = buildItemsUrl(params);
  mutate(url);
}

export function prefetchTodayItems() {
  mutate("/api/items?status=new&limit=20");
}

export function prefetchCategories() {
  mutate("/api/categories");
}

/**
 * Invalidate all caches (useful after creating new items)
 */
export function invalidateAllCaches() {
  mutate((key) => typeof key === "string" && key.startsWith("/api/"), undefined, {
    revalidate: true,
  });
}
