"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ItemCardGamified } from "@/components/items/item-card-gamified";
import { TagBadge } from "@/components/items/tag-badge";
import { Pagination } from "@/components/items/pagination";
import { ItemCardCompact } from "@/components/items/item-card-compact";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ActiveFilters } from "@/components/items/active-filters";
import {
  Search,
  Inbox,
  X,
  Tag,
  Grid3X3,
  List,
  Loader2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import type { ItemCategory, ItemStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useItems, useCategories, updateItemStatus } from "@/hooks/use-items";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTags } from "@/hooks/use-tags";

type ViewMode = "grid" | "list";

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter state (local, synced to URL)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">(
    (searchParams.get("status") as ItemStatus | "all") || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | null>(
    (searchParams.get("category") as ItemCategory) || null,
  );
  const [platformFilter, setPlatformFilter] = useState<string | null>(
    searchParams.get("platform") || null,
  );
  const [tagFilter, setTagFilter] = useState<string | null>(
    searchParams.get("tag") || null,
  );
  const [authorFilter, setAuthorFilter] = useState<string | null>(
    searchParams.get("author") || null,
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Search queries for filter sections
  const [platformSearchQuery, setPlatformSearchQuery] = useState("");
  const [authorSearchQuery, setAuthorSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Batch URL updates to avoid excessive history pushes during rapid filter changes
  const urlUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories with SWR (cached across navigations)
  const {
    categories,
    totalItems,
    platforms,
    authors,
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
    author: authorFilter,
    page: currentPage,
    limit: 16,
  });

  // Compute derived state
  const hasActiveFilters =
    categoryFilter ||
    platformFilter ||
    statusFilter !== "all" ||
    tagFilter ||
    authorFilter ||
    searchQuery;
  const isInListMode = viewMode === "list";

  // Fetch tags from API with global counts (not affected by filters)
  const { tags: tagObjects } = useTags(50, "usage");

  // Update URL when filters change (batched to avoid rapid history pushes)
  const updateUrl = (
    updates: Record<string, string | null>,
    immediate = false,
  ) => {
    // Clear existing timer
    if (urlUpdateTimerRef.current) {
      clearTimeout(urlUpdateTimerRef.current);
    }

    const performUpdate = () => {
      startTransition(() => {
        const params = new URLSearchParams();

        const newSearchQuery =
          updates.q !== undefined ? updates.q : searchQuery;
        const newStatus =
          updates.status !== undefined ? updates.status : statusFilter;
        const newCategory =
          updates.category !== undefined ? updates.category : categoryFilter;
        const newPlatform =
          updates.platform !== undefined ? updates.platform : platformFilter;
        const newTag = updates.tag !== undefined ? updates.tag : tagFilter;
        const newAuthor =
          updates.author !== undefined ? updates.author : authorFilter;
        const newPage =
          updates.page !== undefined ? updates.page : String(currentPage);

        if (newSearchQuery) params.set("q", newSearchQuery);
        if (newStatus && newStatus !== "all") params.set("status", newStatus);
        if (newCategory) params.set("category", newCategory);
        if (newPlatform) params.set("platform", newPlatform);
        if (newTag) params.set("tag", newTag);
        if (newAuthor) params.set("author", newAuthor);
        if (newPage && parseInt(newPage) > 1) params.set("page", newPage);

        router.replace(`/items?${params.toString()}`, { scroll: false });
      });
    };

    // For immediate updates (like pagination), update right away
    // For filter changes, batch with 100ms delay to catch rapid changes
    if (immediate) {
      performUpdate();
    } else {
      urlUpdateTimerRef.current = setTimeout(performUpdate, 100);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }
    };
  }, []);

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
            item.id === id ? { ...item, status: newStatus } : item,
          ),
        };
      },
      { revalidate: false },
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
    setAuthorFilter(null);
    setCurrentPage(1);
    setViewMode("grid");
    router.replace("/items", { scroll: false });
  };

  const handleCategorySelect = (category: ItemCategory | null) => {
    setCategoryFilter(category);
    setCurrentPage(1);
    setViewMode("grid");
    updateUrl({ category, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: String(page) }, true); // Immediate update for pagination
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show loading indicator when validating in background (but not during initial load)
  const isBackgroundLoading =
    (isCategoriesValidating || isItemsValidating) && !isItemsLoading;

  // Use API-provided tag counts (global, not filtered)
  const tagOptions = useMemo(() => {
    return tagObjects.map((t) => ({
      tag: t.displayName,
      count: t.usageCount,
    }));
  }, [tagObjects]);

  // Filter platforms by search query (search both platform and displayName)
  const filteredPlatforms = useMemo(() => {
    if (!platformSearchQuery) return platforms || [];
    const query = platformSearchQuery.toLowerCase();
    return (platforms || []).filter(
      (p) =>
        p.platform.toLowerCase().includes(query) ||
        p.displayName?.toLowerCase().includes(query),
    );
  }, [platforms, platformSearchQuery]);

  // Filter authors by search query
  const filteredAuthors = useMemo(() => {
    if (!authorSearchQuery) return authors || [];
    return (authors || []).filter((a) =>
      a.author.toLowerCase().includes(authorSearchQuery.toLowerCase()),
    );
  }, [authors, authorSearchQuery]);

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return tagOptions;
    return tagOptions.filter((t) =>
      t.tag.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    );
  }, [tagOptions, tagSearchQuery]);

  // Build active filters array for the summary bar
  const activeFilters = useMemo(() => {
    const filters: Array<{
      type: "category" | "platform" | "tag" | "author" | "status" | "search";
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];

    if (categoryFilter) {
      filters.push({
        type: "category",
        label: "Category",
        value: categoryFilter,
        onRemove: () => handleCategorySelect(null),
      });
    }

    if (platformFilter) {
      filters.push({
        type: "platform",
        label: "Source",
        value: platformFilter,
        onRemove: () => {
          setPlatformFilter(null);
          updateUrl({ platform: null });
        },
      });
    }

    if (tagFilter) {
      filters.push({
        type: "tag",
        label: "Tag",
        value: tagFilter,
        onRemove: () => {
          setTagFilter(null);
          updateUrl({ tag: null });
        },
      });
    }

    if (authorFilter) {
      filters.push({
        type: "author",
        label: "Author",
        value: authorFilter,
        onRemove: () => {
          setAuthorFilter(null);
          updateUrl({ author: null });
        },
      });
    }

    if (statusFilter !== "all") {
      filters.push({
        type: "status",
        label: "Status",
        value: statusFilter,
        onRemove: () => {
          setStatusFilter("all");
          updateUrl({ status: "all" });
        },
      });
    }

    if (searchQuery) {
      filters.push({
        type: "search",
        label: "Search",
        value: searchQuery,
        onRemove: () => {
          setSearchQuery("");
          updateUrl({ q: null });
        },
      });
    }

    return filters;
  }, [
    categoryFilter,
    platformFilter,
    tagFilter,
    authorFilter,
    statusFilter,
    searchQuery,
  ]);

  const totalDisplay = pagination?.total ?? totalItems ?? items.length;

  return (
    <div className="space-y-6">
      {/* Hero + controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Library</h1>
            <p className="text-sm text-slate-500">
              {totalDisplay} total items
              {categories.length
                ? ` across ${categories.length} categories`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
            {searchQuery !== debouncedSearchQuery && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
          <Button variant="outline" className="text-sm">
            Newest First
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Categories</p>
          {isBackgroundLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter ? "outline" : "secondary"}
            className={cn(
              "rounded-full border",
              !categoryFilter
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white"
                : "border-slate-200 text-slate-700",
            )}
            onClick={() => handleCategorySelect(null)}
          >
            All {totalItems ? `(${totalItems})` : ""}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.category}
              size="sm"
              variant={
                categoryFilter === cat.category ? "secondary" : "outline"
              }
              className={cn(
                "rounded-full border",
                categoryFilter === cat.category
                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white"
                  : "border-slate-200 text-slate-700",
              )}
              onClick={() => handleCategorySelect(cat.category)}
            >
              {cat.label} ({cat.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Platform filter */}
      <CollapsibleSection
        title="Filter by Source"
        count={platforms?.length || 0}
        defaultOpen={false}
        searchable={true}
        searchPlaceholder="Search sources..."
        onSearchChange={setPlatformSearchQuery}
      >
        <div className="flex flex-wrap gap-2">
          {filteredPlatforms.slice(0, 10).map((p) => (
            <Button
              key={p.platform}
              size="sm"
              variant={platformFilter === p.platform ? "secondary" : "outline"}
              className={cn(
                "rounded-full border",
                platformFilter === p.platform
                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white"
                  : "border-slate-200 text-slate-700",
              )}
              onClick={() => {
                const next = platformFilter === p.platform ? null : p.platform;
                setPlatformFilter(next);
                setCurrentPage(1);
                updateUrl({ platform: next, page: "1" });
              }}
              title={`Includes: ${p.variations?.join(", ") || p.platform}`}
            >
              {p.displayName || p.platform} ({p.count})
            </Button>
          ))}
          {filteredPlatforms.length > 10 && (
            <span className="text-xs text-slate-400 self-center">
              +{filteredPlatforms.length - 10} more
            </span>
          )}
        </div>
      </CollapsibleSection>

      {/* Author Filter */}
      <CollapsibleSection
        title="Filter by Author"
        count={authors?.length || 0}
        defaultOpen={false}
        searchable={true}
        searchPlaceholder="Search authors..."
        onSearchChange={setAuthorSearchQuery}
      >
        <div className="flex flex-wrap gap-2">
          {filteredAuthors.length === 0 ? (
            <p className="text-xs text-slate-500">No authors found.</p>
          ) : (
            filteredAuthors.slice(0, 10).map((a) => (
              <Button
                key={a.author}
                size="sm"
                variant={authorFilter === a.author ? "secondary" : "outline"}
                className={cn(
                  "rounded-full border",
                  authorFilter === a.author
                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white"
                    : "border-slate-200 text-slate-700",
                )}
                onClick={() => {
                  const next = authorFilter === a.author ? null : a.author;
                  setAuthorFilter(next);
                  setCurrentPage(1);
                  updateUrl({ author: next, page: "1" });
                }}
              >
                {a.author} ({a.count})
              </Button>
            ))
          )}
          {filteredAuthors.length > 10 && (
            <span className="text-xs text-slate-400 self-center">
              +{filteredAuthors.length - 10} more
            </span>
          )}
        </div>
      </CollapsibleSection>

      {/* Tags */}
      <CollapsibleSection
        title="Filter by Tags"
        count={tagOptions.length}
        defaultOpen={true}
        searchable={true}
        searchPlaceholder="Search tags..."
        onSearchChange={setTagSearchQuery}
      >
        <div className="flex flex-wrap gap-2">
          {filteredTags.length === 0 ? (
            <p className="text-xs text-slate-500">
              {tagSearchQuery
                ? "No tags found matching your search."
                : "Tags will appear after you add items."}
            </p>
          ) : (
            filteredTags.slice(0, 30).map((t) => (
              <TagBadge
                key={t.tag}
                tag={`${t.tag} (${t.count})`}
                clickable
                isActive={tagFilter === t.tag}
                onClick={() => {
                  const tagName = t.tag;
                  setTagFilter(tagFilter === tagName ? null : tagName);
                  setCurrentPage(1);
                  updateUrl({
                    tag: tagFilter === tagName ? null : tagName,
                    page: "1",
                  });
                }}
              />
            ))
          )}
          {filteredTags.length > 30 && (
            <span className="text-xs text-slate-400 self-center">
              +{filteredTags.length - 30} more
            </span>
          )}
        </div>
      </CollapsibleSection>

      {/* Active Filters Summary */}
      <ActiveFilters
        filters={activeFilters}
        onClearAll={handleClearAllFilters}
      />

      {/* Results */}
      <div
        className={cn(
          "transition-opacity duration-150",
          isItemsValidating && !isItemsLoading ? "opacity-75" : "",
        )}
      >
        {isItemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
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
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{pagination?.total || items.length} items</span>
            </div>

            {isInListMode ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <ItemCardGamified
                    key={item.id}
                    item={item}
                    showActions={item.status === "new"}
                    onStatusChange={handleStatusChange}
                    onTagClick={(tag) => {
                      setTagFilter(tag);
                      setCurrentPage(1);
                      updateUrl({ tag, page: "1" });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => (
                  <ItemCardCompact
                    key={item.id}
                    item={item}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )}

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

      {/* Detail modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mt-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 p-2 bg-white/90 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-all z-10 shadow-sm border border-slate-100"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4">
              <ItemCardGamified
                item={selectedItem}
                showActions={selectedItem.status === "new"}
                onStatusChange={handleStatusChange}
                onTagClick={(tag) => {
                  setTagFilter(tag);
                  setCurrentPage(1);
                  updateUrl({ tag, page: "1" });
                  setSelectedItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
