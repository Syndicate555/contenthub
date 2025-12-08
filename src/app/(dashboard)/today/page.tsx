"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { ItemCardGamified } from "@/components/items/item-card-gamified";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Inbox,
  Sparkles,
  ArrowRight,
  Loader2,
  Search,
  Filter,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MessageCircle,
  Pin,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useTodayItemsWithFilters,
  updateItemStatus,
} from "@/hooks/use-items";
import type { ItemStatus } from "@/types";
import { TodaySidebar } from "@/components/today/TodaySidebar";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTodaySidebar } from "@/hooks/use-today-sidebar";
import { PLATFORM_CONFIG, PlatformSlug } from "@/lib/platforms";

export default function TodayPage() {
  const [processedToday, setProcessedToday] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformSlug | null>(
    null
  );
  const [page, setPage] = useState(1);

  const {
    sources,
    isLoading: sidebarLoading,
    error: sidebarError,
  } = useTodaySidebar();

  // Fetch items with SWR (cached across navigations)
  const {
    items,
    isLoading,
    isValidating,
    error,
    pagination,
    mutate: mutateItems,
  } = useTodayItemsWithFilters({
    platform: selectedPlatform || undefined,
    q: debouncedSearch || undefined,
    page,
  });

  const platformCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sources.forEach((source) => counts.set(source.source, source.count));
    return counts;
  }, [sources]);

  // Total "new" items available before filtering; falls back to current items length if counts unavailable
  const totalCount =
    (sources && sources.length > 0
      ? sources.reduce((sum, s) => sum + s.count, 0)
      : 0) || items.length || 0;

  const hasActiveFilters = Boolean(
    (selectedPlatform && selectedPlatform !== null) ||
      (debouncedSearch && debouncedSearch.trim().length > 0)
  );

  const platformChips = useMemo(
    () =>
      PLATFORM_CONFIG.filter((platform) => platform.slug !== "other").map(
        (platform) => ({
          slug: platform.slug,
          label: platform.label,
          count: platformCounts.get(platform.slug) || 0,
          icon: platform.icon,
        })
      ),
    [platformCounts]
  );

  // Handle status change with optimistic update
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistically remove the item from the list
    mutateItems(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.filter((item) => item.id !== id),
        };
      },
      { revalidate: false }
    );

    setProcessedToday((prev) => prev + 1);

    // Make the actual API call
    await updateItemStatus(id, newStatus as ItemStatus);
  };

  function EmptyState() {
    const noResults = hasActiveFilters && items.length === 0 && totalCount > 0;
    const caughtUp = !hasActiveFilters && totalCount === 0;

    if (noResults) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No results match your filters
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Try adjusting your search or selecting a different source to see more items.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedPlatform(null);
              }}
              className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Clear filters
            </button>
            <Link
              href="/items"
              className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Browse Library
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      );
    }

    if (caughtUp) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-linear-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            All caught up!
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You have no new items to review. Your inbox is empty and ready for new content.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/add"
              className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Add Content
            </Link>
            <Link
              href="/items"
              className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Browse Library
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      );
    }

    return null;
  }

  // Get current date formatted
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Show skeleton only if loading AND no cached data
  const showSkeleton = isLoading && items.length === 0;

  const platformIconMap: Partial<Record<PlatformSlug, ComponentType<{ className?: string }>>> = {
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    pinterest: Pin,
    youtube: Youtube,
    newsletter: Mail,
    reddit: MessageCircle,
  };

  const renderPlatformIcon = (slug: PlatformSlug) => {
    const Icon = platformIconMap[slug];
    if (!Icon) return null;
    return <Icon className="w-4 h-4" />;
  };

  // Reset pagination when filters/search change
  useEffect(() => {
    setPage(1);
  }, [selectedPlatform, debouncedSearch]);

  return (
    <div className="w-full">
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[280px_minmax(0,1.5fr)_280px]">
        {/* Left Sidebar - User Profile & Stats */}
        <aside className="hidden lg:block w-full">
          <TodaySidebar />
        </aside>

        {/* Main Content - Wide Center Feed */}
        <div className="w-full space-y-6">
          {/* Header - Always visible immediately */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                {/* Background refresh indicator */}
                {isValidating && !isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {processedToday > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processedToday} processed</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">{today}</p>
          </div>

          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Search className="w-4 h-4" />
                <span>Search items</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, tags, or content..."
                  className="pl-9 pr-3 h-11 text-sm bg-gray-50 border-gray-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <Filter className="w-4 h-4" />
                <span>Filter by source</span>
                {sidebarError && (
                  <span className="text-xs text-red-500">(counts unavailable)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all",
                    selectedPlatform === null
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  )}
                >
                  <span>All</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      selectedPlatform === null
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {totalCount}
                  </span>
                </button>
                {platformChips.map((platform) => {
                  const isActive = selectedPlatform === platform.slug;
                  return (
                    <button
                      key={platform.slug}
                      onClick={() => setSelectedPlatform(platform.slug as PlatformSlug)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all",
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {renderPlatformIcon(platform.slug as PlatformSlug)}
                        <span>{platform.label}</span>
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {platform.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {sidebarLoading && (
                <p className="text-xs text-gray-400 mt-2">Loading counts...</p>
              )}
              {(isValidating || isLoading) && (
                <div
                  className="flex items-center gap-2 text-xs text-gray-500 mt-3"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span>Updating results...</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading state with skeleton */}
          {showSkeleton ? (
            <div className="space-y-6">
              {/* Skeleton for stats banner */}
              <Skeleton className="h-24 w-full rounded-xl" />
              {/* Skeleton for items */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-64" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => mutateItems()}
                className="text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Stats Banner - Show immediately with cached data */}
              {items.length > 0 && (
                <div
                  className={cn(
                    "bg-linear-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white transition-opacity duration-200",
                    isValidating && "opacity-90"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Inbox items</p>
                        <p className="text-2xl font-bold">{items.length}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/70">
                        Take action on each item
                      </p>
                      <p className="text-sm">Pin, Archive, or Delete</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Feed */}
              {items.length === 0 ? (
                <EmptyState />
              ) : (
                <div
                  className={cn(
                    "space-y-4 transition-opacity duration-150",
                    isValidating && items.length > 0 ? "opacity-90" : ""
                  )}
                >
                  {/* Feed intro */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span>
                      Review your saved content and decide what to keep
                    </span>
                  </div>

                  {/* Item Cards - Show cached data immediately */}
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "transform transition-all duration-300",
                        "animate-in fade-in slide-in-from-bottom-2"
                      )}
                      style={{
                        animationDelay: `${Math.min(index * 50, 200)}ms`,
                      }}
                    >
                      <ItemCardGamified
                        item={item}
                        showActions={true}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  ))}

                  {/* Pagination controls */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-gray-200 bg-white rounded-lg px-4 py-3 shadow-sm">
                      <div className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={pagination.page <= 1 || isLoading || isValidating}
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-sm transition-colors",
                            pagination.page <= 1 || isLoading || isValidating
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={!pagination.hasMore || isLoading || isValidating}
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-sm transition-colors",
                            !pagination.hasMore || isLoading || isValidating
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* End of feed */}
                  <div className="text-center py-8 text-gray-400 text-sm">
                    End of your inbox
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - AI Assistant Placeholder */}
        <aside className="hidden lg:block w-full">
          <div className="sticky top-20">
            <div className="bg-white rounded-lg border border-gray-200 border-dashed p-6 shadow-sm">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-gray-500">
                    Chat with AI about your saved content
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
