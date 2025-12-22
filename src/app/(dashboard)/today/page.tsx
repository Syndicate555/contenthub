"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { ItemCardGamified } from "@/components/items/item-card-gamified";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Inbox,
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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTodayItemsWithFilters, updateItemStatus } from "@/hooks/use-items";
import type { ItemStatus } from "@/types";
import { TodaySidebar } from "@/components/today/TodaySidebar";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTodaySidebar } from "@/hooks/use-today-sidebar";
import { PLATFORM_CONFIG, PlatformSlug } from "@/lib/platforms";
import {
  CaughtUpIllustration,
  NoResultsIllustration,
} from "@/components/ui/empty-state-illustration";

export default function TodayPage() {
  const [processedToday, setProcessedToday] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformSlug | null>(
    null,
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
    sources.forEach((source: { source: string; count: number }) =>
      counts.set(source.source, source.count),
    );
    return counts;
  }, [sources]);

  // Total "new" items available before filtering; falls back to current items length if counts unavailable
  const totalCount =
    (sources && sources.length > 0
      ? sources.reduce((sum: any, s: { count: any }) => sum + s.count, 0)
      : 0) ||
    items.length ||
    0;

  const hasActiveFilters = Boolean(
    (selectedPlatform && selectedPlatform !== null) ||
    (debouncedSearch && debouncedSearch.trim().length > 0),
  );
  const headerCount =
    (pagination?.total ?? 0) ||
    (sources && sources.length > 0
      ? sources.reduce((sum: any, s: { count: any }) => sum + s.count, 0)
      : 0) ||
    items.length;

  const platformChips = useMemo(
    () =>
      PLATFORM_CONFIG.filter((platform) => platform.slug !== "other").map(
        (platform) => ({
          slug: platform.slug,
          label: platform.label,
          count: platformCounts.get(platform.slug) || 0,
          icon: platform.icon,
        }),
      ),
    [platformCounts],
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
      { revalidate: false },
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="mb-6">
            <NoResultsIllustration />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No results match your filters
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Try adjusting your search or selecting a different source to see
            more items.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm("");
                setSelectedPlatform(null);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              Clear filters
            </motion.button>
            <Link href="/items">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-all font-semibold"
              >
                Browse Library
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      );
    }

    if (caughtUp) {
      return (
        <div className="text-center py-16">
          <div className="mb-6">
            <CaughtUpIllustration />
          </div>
          <h2 className="text-2xl font-bold text-gradient-purple-pink mb-3">
            All caught up!
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            You have no new items to review. Your inbox is empty and ready for
            new content.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/add">
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold">
                Add Content
              </button>
            </Link>
            <Link href="/items">
              <button className="inline-flex items-center px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-all font-semibold">
                Browse Library
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
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

  const platformIconMap: Partial<
    Record<PlatformSlug, ComponentType<{ className?: string }>>
  > = {
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
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
    <div className="w-full min-h-screen mesh-gradient-vibrant">
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[280px_minmax(0,1.5fr)_280px]">
        {/* Left Sidebar - User Profile & Stats */}
        <aside className="hidden lg:block w-full">
          <TodaySidebar />
        </aside>

        {/* Main Content - Wide Center Feed */}
        <div className="w-full space-y-4">
          {/* Compact Header with integrated search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex items-center gap-4">
                {/* Left: Title + Count */}
                <div className="flex items-center gap-3 min-w-fit">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-md"
                  >
                    <Inbox className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                    <div className="flex items-center gap-2">
                      <motion.span
                        key={headerCount}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-black text-gray-900"
                      >
                        {headerCount}
                      </motion.span>
                      <span className="text-sm text-gray-500 font-medium">
                        items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top-right badges */}
                <div className="flex items-center gap-2 ml-auto">
                  {processedToday > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 rounded-full shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-semibold">{processedToday}</span>
                    </motion.div>
                  )}
                  {isValidating && !isLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Search on its own row for better responsiveness */}
              <div className="relative group w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                </div>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, tags, or content..."
                  className="pl-10 pr-16 h-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all w-full"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </motion.button>
                )}
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Your personal social media feed • {today}
              </p>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPlatform(null);
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  Clear all filters
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Platform Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700 text-xs font-semibold uppercase tracking-wide">
                <Filter className="w-4 h-4 text-gray-500" />
                <span>Filter by source</span>
              </div>
              {sidebarError && (
                <span className="text-xs text-red-500 font-medium">
                  (counts unavailable)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlatform(null)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedPlatform === null
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                )}
              >
                <span className="font-semibold">All</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    selectedPlatform === null
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  {totalCount}
                </span>
              </motion.button>
              {platformChips.map((platform) => {
                const isActive = selectedPlatform === platform.slug;

                // Platform gradient classes mapping
                const platformGradients: Record<string, string> = {
                  twitter:
                    "from-black to-gray-800 hover:from-gray-900 hover:to-gray-700",
                  linkedin:
                    "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                  instagram: "from-pink-500 via-purple-500 to-orange-500",
                  youtube:
                    "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
                  reddit:
                    "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
                };

                return (
                  <motion.button
                    key={platform.slug}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setSelectedPlatform(platform.slug as PlatformSlug)
                    }
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      isActive
                        ? `bg-gradient-to-r ${platformGradients[platform.slug] || "from-indigo-600 to-purple-600"} text-white shadow-md`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {renderPlatformIcon(platform.slug as PlatformSlug)}
                      <span>{platform.label}</span>
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600",
                      )}
                    >
                      {platform.count}
                    </span>
                  </motion.button>
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
          </motion.div>

          {/* Loading state with skeleton */}
          {showSkeleton ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
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
              {/* Items Feed */}
              {items.length === 0 ? (
                <EmptyState />
              ) : (
                <div
                  className={cn(
                    "space-y-4 transition-opacity duration-150",
                    isValidating && items.length > 0 ? "opacity-90" : "",
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
                  <div className="space-y-4">
                    {items.map((item) => (
                      <ItemCardGamified
                        key={item.id}
                        item={item}
                        showActions={true}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-gray-200 bg-white rounded-lg px-4 py-3 shadow-sm">
                      <div className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={
                            pagination.page <= 1 || isLoading || isValidating
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-sm transition-colors",
                            pagination.page <= 1 || isLoading || isValidating
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={
                            !pagination.hasMore || isLoading || isValidating
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-md border text-sm transition-colors",
                            !pagination.hasMore || isLoading || isValidating
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
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
