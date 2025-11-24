"use client";

import { useState, useMemo, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ItemCard } from "@/components/items/item-card";
import { TagBadge } from "@/components/items/tag-badge";
import { FolderGrid } from "@/components/items/folder-grid";
import { FilterBar } from "@/components/items/filter-bar";
import { Pagination } from "@/components/items/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Inbox,
  X,
  Tag,
  Grid3X3,
  List,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { ItemCategory, ItemStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useItems, useCategories, updateItemStatus } from "@/hooks/use-items";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type ViewMode = "folders" | "list";

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("folders");

  // Filter state (local, synced to URL)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">(
    (searchParams.get("status") as ItemStatus | "all") || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | null>(
    (searchParams.get("category") as ItemCategory) || null
  );
  const [platformFilter, setPlatformFilter] = useState<string | null>(
    searchParams.get("platform") || null
  );
  const [tagFilter, setTagFilter] = useState<string | null>(
    searchParams.get("tag") || null
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Fetch categories with SWR (cached across navigations)
  const {
    categories,
    totalItems,
    platforms,
    isLoading: isCategoriesLoading,
    isValidating: isCategoriesValidating,
  } = useCategories();

  // Fetch items with SWR (cached across navigations)
  const {
    items,
    pagination,
    isLoading: isItemsLoading,
    isValidating: isItemsValidating,
    mutate: mutateItems,
  } = useItems({
    q: debouncedSearchQuery || undefined,
    status: statusFilter,
    category: categoryFilter,
    platform: platformFilter,
    tag: tagFilter,
    page: currentPage,
    limit: 16,
  });

  // Compute derived state
  const hasActiveFilters =
    categoryFilter ||
    platformFilter ||
    statusFilter !== "all" ||
    tagFilter ||
    searchQuery;
  const isInListMode = viewMode === "list" || hasActiveFilters;

  // Collect unique tags from items for the filter dropdown
  const allTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags || []))],
    [items]
  );

  // Update URL when filters change (non-blocking)
  const updateUrl = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams();

      const newSearchQuery = updates.q !== undefined ? updates.q : searchQuery;
      const newStatus =
        updates.status !== undefined ? updates.status : statusFilter;
      const newCategory =
        updates.category !== undefined ? updates.category : categoryFilter;
      const newPlatform =
        updates.platform !== undefined ? updates.platform : platformFilter;
      const newTag = updates.tag !== undefined ? updates.tag : tagFilter;
      const newPage =
        updates.page !== undefined ? updates.page : String(currentPage);

      if (newSearchQuery) params.set("q", newSearchQuery);
      if (newStatus && newStatus !== "all") params.set("status", newStatus);
      if (newCategory) params.set("category", newCategory);
      if (newPlatform) params.set("platform", newPlatform);
      if (newTag) params.set("tag", newTag);
      if (newPage && parseInt(newPage) > 1) params.set("page", newPage);

      router.replace(`/items?${params.toString()}`, { scroll: false });
    });
  };

  // Handle status change with optimistic update
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistically update local state
    mutateItems(
      (current) => {
        if (!current) return current;

        // If filtering by status and item no longer matches, remove it
        if (statusFilter !== "all" && newStatus !== statusFilter) {
          return {
            ...current,
            data: current.data.filter((item) => item.id !== id),
          };
        }

        // Otherwise update the item's status
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          ),
        };
      },
      { revalidate: false }
    );

    // Make the actual API call
    await updateItemStatus(id, newStatus as ItemStatus);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter(null);
    setPlatformFilter(null);
    setTagFilter(null);
    setCurrentPage(1);
    setViewMode("folders");
    router.replace("/items", { scroll: false });
  };

  const handleCategorySelect = (category: ItemCategory | null) => {
    setCategoryFilter(category);
    setCurrentPage(1);
    if (category) {
      setViewMode("list");
      updateUrl({ category, page: "1" });
    } else {
      setViewMode("folders");
      updateUrl({ category: null, page: "1" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show loading indicator when validating in background (but not during initial load)
  const isBackgroundLoading =
    (isCategoriesValidating || isItemsValidating) && !isItemsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isInListMode && hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to folders
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === "folders" && !hasActiveFilters
              ? "Library"
              : "All Items"}
          </h1>
          {/* Background loading indicator */}
          {isBackgroundLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => {
              setViewMode("folders");
              if (!hasActiveFilters) handleClearAllFilters();
            }}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "folders" && !hasActiveFilters
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              isInListMode
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder Grid View - Show cached data immediately */}
      {viewMode === "folders" && !hasActiveFilters && (
        <FolderGrid
          categories={categories}
          selectedCategory={categoryFilter}
          onCategorySelect={handleCategorySelect}
          isLoading={isCategoriesLoading && categories.length === 0}
          totalItems={totalItems}
        />
      )}

      {/* List View */}
      {isInListMode && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
            {/* Search loading indicator */}
            {searchQuery !== debouncedSearchQuery && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            selectedCategory={categoryFilter}
            selectedPlatform={platformFilter}
            selectedStatus={statusFilter}
            selectedTag={tagFilter}
            platforms={platforms}
            tags={allTags}
            onCategoryChange={(cat) => {
              setCategoryFilter(cat);
              setCurrentPage(1);
              updateUrl({ category: cat, page: "1" });
            }}
            onPlatformChange={(platform) => {
              setPlatformFilter(platform);
              setCurrentPage(1);
              updateUrl({ platform, page: "1" });
            }}
            onStatusChange={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
              updateUrl({ status, page: "1" });
            }}
            onTagChange={(tag) => {
              setTagFilter(tag);
              setCurrentPage(1);
              updateUrl({ tag, page: "1" });
            }}
            onClearAll={handleClearAllFilters}
          />

          {/* Active Tag Filter Banner */}
          {tagFilter && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtering by tag:</span>
              <TagBadge tag={tagFilter} clickable={false} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTagFilter(null);
                  updateUrl({ tag: null });
                }}
                className="ml-auto h-7 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Results - Show skeleton during filter transitions, cached data otherwise */}
          <div
            className={cn(
              "transition-opacity duration-150",
              isItemsValidating && !isItemsLoading ? "opacity-75" : ""
            )}
          >
            {/* Loading state - show skeletons when loading (including filter changes) */}
            {isItemsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  No items found
                </h2>
                <p className="text-gray-500 mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Start by adding some content."}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={handleClearAllFilters}>
                    Clear all filters
                  </Button>
                ) : (
                  <Link
                    href="/add"
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add Content
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {pagination?.total || items.length} item
                  {(pagination?.total || items.length) !== 1 ? "s" : ""}
                  {categoryFilter && ` in ${categoryFilter}`}
                  {tagFilter && ` tagged "${tagFilter}"`}
                </p>
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    showActions={item.status === "new"}
                    onStatusChange={handleStatusChange}
                  />
                ))}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    isLoading={isItemsValidating}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
