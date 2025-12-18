"use client";

import useSWR, { mutate } from "swr";
import { useAuth } from "@clerk/nextjs";
import type { Item } from "@/generated/prisma";
import type { ItemCategory, ItemStatus, PaginationMeta } from "@/types";

// Enhanced Item type with gamification data
export interface EnhancedItem extends Item {
  domain?: {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    color: string;
  } | null;
  xpEarned: number;
  xpBreakdown: Record<string, number>;
  isInFocusArea: boolean;
}

// API Response types
interface ItemsResponse {
  ok: boolean;
  data: EnhancedItem[];
  meta: PaginationMeta;
}

interface CategoriesResponse {
  ok: boolean;
  data: {
    categories: CategoryData[];
    totalItems: number;
    platforms: {
      platform: string;
      displayName: string;
      count: number;
      variations: string[];
    }[];
    authors: { author: string; count: number }[];
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
  author?: string | null;
  page?: number;
  limit?: number;
}

// Build URL with query params
function buildItemsUrl(params: ItemsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.status && params.status !== "all")
    searchParams.set("status", params.status);
  if (params.category) searchParams.set("category", params.category);
  if (params.platform) searchParams.set("platform", params.platform);
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.author) searchParams.set("author", params.author);
  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 16));

  return `/api/items?${searchParams.toString()}`;
}

/**
 * Hook to fetch items with filters and pagination
 * REBUILT FROM SCRATCH - Simple, clean approach
 */
export function useItems(params: ItemsQueryParams = {}) {
  const { isLoaded, userId } = useAuth();
  const url = buildItemsUrl(params);

  // Simple approach: only fetch if auth is ready
  const shouldFetch = isLoaded && userId;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateItems,
  } = useSWR<ItemsResponse>(shouldFetch ? url : null, {
    // Only validate on mount
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
  });

  return {
    items: data?.data || [],
    pagination: data?.meta || null,
    isLoading: !shouldFetch || (isLoading && !data),
    isValidating,
    error: error?.message || null,
    mutate: mutateItems,
  };
}

/**
 * Hook to fetch "Today" items (new status)
 * REBUILT FROM SCRATCH - Simple, clean approach
 */
export function useTodayItems() {
  return useTodayItemsWithFilters({});
}

export function useTodayItemsWithFilters(params: {
  platform?: string | null;
  q?: string | null;
  page?: number;
}) {
  const { isLoaded, userId } = useAuth();
  const url = buildItemsUrl({
    status: "new",
    limit: 20,
    page: params.page || 1,
    platform: params.platform || undefined,
    q: params.q || undefined,
  });

  // Simple approach: only fetch if auth is ready
  const shouldFetch = isLoaded && userId;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateItems,
  } = useSWR<ItemsResponse>(shouldFetch ? url : null, {
    revalidateOnFocus: true, // Refresh when user returns to tab
    revalidateOnMount: true,
    revalidateOnReconnect: true, // Refresh when internet reconnects
    refreshInterval: 30000, // Poll every 30 seconds for new items
  });

  return {
    items: data?.data || [],
    pagination: data?.meta || null,
    isLoading: !shouldFetch || (isLoading && !data),
    isValidating,
    error: error?.message || null,
    mutate: mutateItems,
  };
}

/**
 * Hook to fetch categories with counts and thumbnails
 * REBUILT FROM SCRATCH - Simple, clean approach
 */
export function useCategories() {
  const { isLoaded, userId } = useAuth();
  const url = "/api/categories";

  // Simple approach: only fetch if auth is ready
  const shouldFetch = isLoaded && userId;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateCategories,
  } = useSWR<CategoriesResponse>(shouldFetch ? url : null, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    // Cache categories a bit longer
    dedupingInterval: 5000,
  });

  return {
    categories: data?.data?.categories || [],
    totalItems: data?.data?.totalItems || 0,
    platforms: data?.data?.platforms || [],
    authors: data?.data?.authors || [],
    isLoading: !shouldFetch || (isLoading && !data),
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
  newStatus: ItemStatus,
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
    mutate((key) => typeof key === "string" && key.startsWith("/api/items"));
    mutate("/api/categories");

    return true;
  } catch (error) {
    console.error("Failed to update item status:", error);
    return false;
  }
}

/**
 * Prefetch data for instant navigation
 */
export function prefetchItems(params: ItemsQueryParams = {}) {
  const url = buildItemsUrl(params);
  mutate(url);
}

export function prefetchTodayItems() {
  const url = buildItemsUrl({ status: "new", limit: 20 });
  mutate(url);
}

export function prefetchCategories() {
  mutate("/api/categories");
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches() {
  mutate(() => true);
}
