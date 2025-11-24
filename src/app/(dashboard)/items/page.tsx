"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ItemCard } from "@/components/items/item-card";
import { TagBadge } from "@/components/items/tag-badge";
import { FolderGrid } from "@/components/items/folder-grid";
import { FilterBar } from "@/components/items/filter-bar";
import { Pagination } from "@/components/items/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, X, Tag, Grid3X3, List, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Item } from "@/generated/prisma";
import type { ItemCategory, ItemStatus, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "folders" | "list";

interface CategoryData {
  category: ItemCategory;
  label: string;
  icon: string;
  count: number;
  thumbnails: string[];
  titles: string[];
}

interface CategoriesResponse {
  categories: CategoryData[];
  totalItems: number;
  platforms: { platform: string; count: number }[];
}

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("folders");

  // Items state
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories state
  const [categoriesData, setCategoriesData] = useState<CategoriesResponse | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Filter state
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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.ok) {
        setCategoriesData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (platformFilter) params.set("platform", platformFilter);
      if (tagFilter) params.set("tag", tagFilter);
      params.set("page", String(currentPage));
      params.set("limit", "16");

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch items");
      }

      setItems(data.data);
      setPagination(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, platformFilter, tagFilter, currentPage]);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch items with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchItems]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (platformFilter) params.set("platform", platformFilter);
    if (tagFilter) params.set("tag", tagFilter);
    if (currentPage > 1) params.set("page", String(currentPage));

    router.replace(`/items?${params.toString()}`, { scroll: false });
  }, [searchQuery, statusFilter, categoryFilter, platformFilter, tagFilter, currentPage, router]);

  // Switch to list view when a category is selected
  useEffect(() => {
    if (categoryFilter || tagFilter || searchQuery || platformFilter) {
      setViewMode("list");
    }
  }, [categoryFilter, tagFilter, searchQuery, platformFilter]);

  const handleStatusChange = (id: string, newStatus: string) => {
    if (statusFilter !== "all" && newStatus !== statusFilter) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    }
    // Refresh categories count
    fetchCategories();
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter(null);
    setPlatformFilter(null);
    setTagFilter(null);
    setCurrentPage(1);
    setViewMode("folders");
  };

  const handleCategorySelect = (category: ItemCategory | null) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    categoryFilter || platformFilter || statusFilter !== "all" || tagFilter || searchQuery;

  // Collect unique tags from items for the filter dropdown
  const allTags = [...new Set(items.flatMap((item) => item.tags || []))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewMode === "list" && hasActiveFilters && (
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
            {viewMode === "folders" ? "Library" : "All Items"}
          </h1>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode("folders")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "folders"
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
              viewMode === "list"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder Grid View */}
      {viewMode === "folders" && !hasActiveFilters && (
        <FolderGrid
          categories={categoriesData?.categories || []}
          selectedCategory={categoryFilter}
          onCategorySelect={handleCategorySelect}
          isLoading={isCategoriesLoading}
          totalItems={categoriesData?.totalItems || 0}
        />
      )}

      {/* List View */}
      {(viewMode === "list" || hasActiveFilters) && (
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
          </div>

          {/* Filter Bar */}
          <FilterBar
            selectedCategory={categoryFilter}
            selectedPlatform={platformFilter}
            selectedStatus={statusFilter}
            selectedTag={tagFilter}
            platforms={categoriesData?.platforms || []}
            tags={allTags}
            onCategoryChange={(cat) => {
              setCategoryFilter(cat);
              setCurrentPage(1);
            }}
            onPlatformChange={(platform) => {
              setPlatformFilter(platform);
              setCurrentPage(1);
            }}
            onStatusChange={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            onTagChange={(tag) => {
              setTagFilter(tag);
              setCurrentPage(1);
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
                onClick={() => setTagFilter(null)}
                className="ml-auto h-7 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchItems} className="text-blue-600 hover:underline">
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">No items found</h2>
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
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
