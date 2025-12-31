"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemCardGamified } from "@/components/items/item-card-gamified";
import { Pagination } from "@/components/items/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems, useCategories, updateItemStatus } from "@/hooks/use-items";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Loader2,
  X,
  ChevronDown,
  Briefcase,
  MonitorSmartphone,
  Palette,
  Zap,
  GraduationCap,
  Coffee,
  Film,
  Sparkles,
} from "lucide-react";
import type { ItemCategory, ItemStatus } from "@/types";
import { useTags } from "@/hooks/use-tags";
import Image from "next/image";
import PlatformIcon, {
  getPlatformInfo,
} from "@/components/items/platform-icon";

type FacetOption = { value: string; label: string; count?: number };

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">(
    (searchParams.get("status") as ItemStatus | "all") || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory[]>(
    searchParams.getAll("category") as ItemCategory[],
  );
  const platformParams = searchParams.getAll("platform");
  const platformSingle = searchParams.get("platform");
  const [platformFilter, setPlatformFilter] = useState<string[]>(
    platformParams.length > 0
      ? [platformParams[0]]
      : platformSingle
        ? [platformSingle]
        : [],
  );
  const [tagFilter, setTagFilter] = useState<string[]>(
    searchParams.getAll("tag"),
  );
  const [authorFilter, setAuthorFilter] = useState<string[]>(
    searchParams.getAll("author"),
  );
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const urlUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const {
    categories,
    totalItems,
    platforms,
    authors,
    isLoading: isCategoriesLoading,
    isValidating: isCategoriesValidating,
  } = useCategories();
  const { tags: tagObjects } = useTags(100, "usage");

  const derivedTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const tagList: string[] = Array.isArray((item as any).tags)
        ? (item as any).tags
        : Array.isArray((item as any).itemTags)
          ? (item as any).itemTags
              .map((it: any) => it?.tag?.displayName)
              .filter((t: string | undefined): t is string => Boolean(t))
          : [];

      tagList.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [items]);

  const hasActiveFilters =
    categoryFilter.length > 0 ||
    platformFilter.length > 0 ||
    tagFilter.length > 0 ||
    authorFilter.length > 0 ||
    statusFilter !== "all" ||
    !!searchQuery;

  const isBackgroundLoading =
    (isCategoriesValidating || isItemsValidating) && !isItemsLoading;

  const updateUrl = (
    updates: Record<string, string | string[] | null>,
    immediate = false,
  ) => {
    if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);

    const performUpdate = () =>
      startTransition(() => {
        const params = new URLSearchParams();

        const nextSearch = updates.q ?? searchQuery;
        const nextStatus =
          (updates.status as ItemStatus | "all" | undefined) ?? statusFilter;
        const nextCategory = updates.category ?? categoryFilter;
        const nextPlatformRaw = updates.platform ?? platformFilter;
        const nextTag = updates.tag ?? tagFilter;
        const nextAuthor = updates.author ?? authorFilter;
        const nextPage = updates.page ?? String(currentPage);

        if (nextSearch) params.set("q", nextSearch as string);
        if (nextStatus && nextStatus !== "all")
          params.set("status", nextStatus as string);

        const appendAll = (key: string, vals?: string | string[] | null) => {
          if (!vals) return;
          (Array.isArray(vals) ? vals : [vals]).forEach((v) =>
            params.append(key, v),
          );
        };

        appendAll("category", nextCategory as any);
        appendAll(
          "platform",
          Array.isArray(nextPlatformRaw)
            ? nextPlatformRaw.slice(0, 1)
            : nextPlatformRaw
              ? [nextPlatformRaw]
              : [],
        );
        appendAll("tag", nextTag as any);
        appendAll("author", nextAuthor as any);

        if (nextPage && parseInt(nextPage as string) > 1)
          params.set("page", nextPage as string);

        router.replace(`/items?${params.toString()}`, { scroll: false });
      });

    if (immediate) performUpdate();
    else urlUpdateTimerRef.current = setTimeout(performUpdate, 120);
  };

  useEffect(
    () => () => {
      if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);
    },
    [],
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    mutateItems(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item,
          ),
        };
      },
      { revalidate: false },
    );
    await updateItemStatus(id, newStatus as ItemStatus);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter([]);
    setPlatformFilter([]);
    setTagFilter([]);
    setAuthorFilter([]);
    setCurrentPage(1);
    router.replace("/items", { scroll: false });
  };

  const totalDisplay = pagination?.total ?? totalItems ?? items.length;

  return (
    <div className="space-y-4 lg:space-y-6">
      <StickyTopBar
        searchQuery={searchQuery}
        setSearchQuery={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        isSearching={searchQuery !== debouncedSearchQuery}
        totalDisplay={totalDisplay}
        totalItems={totalItems}
        onClearSearch={() => setSearchQuery("")}
        hasFilters={hasActiveFilters}
        onClearAll={handleClearAllFilters}
        statusFilter={statusFilter}
        setStatusFilter={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
          updateUrl({ status: s });
        }}
        onOpenMobileFilters={() => setShowFiltersDrawer(true)}
      >
        <ActiveFiltersRow
          categoryFilter={categoryFilter}
          platformFilter={platformFilter}
          tagFilter={tagFilter}
          authorFilter={authorFilter}
          onRemoveFilter={(type, value) => {
            const updater = <T extends string>(
              current: T[],
              setter: (v: T[]) => void,
              key: string,
            ) => {
              const next = current.filter((v) => v !== value);
              setter(next);
              updateUrl({ [key]: next });
            };
            if (type === "category")
              updater<ItemCategory>(
                categoryFilter as ItemCategory[],
                setCategoryFilter as (v: ItemCategory[]) => void,
                "category",
              );
            if (type === "platform")
              updater(platformFilter, setPlatformFilter, "platform");
            if (type === "tag") updater(tagFilter, setTagFilter, "tag");
            if (type === "author")
              updater(authorFilter, setAuthorFilter, "author");
          }}
        />
      </StickyTopBar>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 lg:gap-6">
        <div className="hidden lg:block">
          <FiltersSidebar
            categories={categories}
            platforms={platforms}
            authors={authors || []}
            tags={
              tagObjects && tagObjects.length
                ? tagObjects.map((t) => ({
                    tag: t.displayName,
                    count: t.usageCount,
                  }))
                : derivedTagCounts
            }
            selectedCategories={categoryFilter}
            selectedPlatforms={platformFilter}
            selectedAuthors={authorFilter}
            selectedTags={tagFilter}
            onCategoriesUpdate={(vals) => {
              setCategoryFilter(vals as ItemCategory[]);
              updateUrl({ category: vals, page: "1" });
            }}
            onPlatformsUpdate={(vals) => {
              const single = vals.slice(0, 1);
              setPlatformFilter(single);
              updateUrl({ platform: single, page: "1" });
            }}
            onAuthorsUpdate={(vals) => {
              setAuthorFilter(vals);
              updateUrl({ author: vals, page: "1" });
            }}
            onTagsUpdate={(vals) => {
              setTagFilter(vals);
              updateUrl({ tag: vals, page: "1" });
            }}
          />
        </div>

        <div className="space-y-4">
          {isItemsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-semibold text-foreground">
                No items found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ItemThumbnailCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total ?? items.length}
                  itemsPerPage={pagination.limit ?? 16}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    updateUrl({ page: String(page) }, true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-5xl w-[94vw] sm:w-[90vw] lg:w-[80vw] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title || "Item details"}</DialogTitle>
            <DialogDescription>
              {selectedItem?.source || "Content"}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="pb-4">
              <ItemCardGamified
                item={selectedItem}
                showActions
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FiltersDrawer
        open={showFiltersDrawer}
        onOpenChange={setShowFiltersDrawer}
        categories={categories}
        platforms={platforms}
        authors={authors || []}
        tags={
          tagObjects && tagObjects.length
            ? tagObjects.map((t) => ({
                tag: t.displayName,
                count: t.usageCount,
              }))
            : derivedTagCounts
        }
        selectedCategories={categoryFilter}
        selectedPlatforms={platformFilter}
        selectedAuthors={authorFilter}
        selectedTags={tagFilter}
        onCategoriesUpdate={(vals) => {
          setCategoryFilter(vals as ItemCategory[]);
          updateUrl({ category: vals, page: "1" });
        }}
        onPlatformsUpdate={(vals) => {
          const single = vals.slice(0, 1);
          setPlatformFilter(single);
          updateUrl({ platform: single, page: "1" });
        }}
        onAuthorsUpdate={(vals) => {
          setAuthorFilter(vals);
          updateUrl({ author: vals, page: "1" });
        }}
        onTagsUpdate={(vals) => {
          setTagFilter(vals);
          updateUrl({ tag: vals, page: "1" });
        }}
        onClearAll={() => {
          handleClearAllFilters();
          setShowFiltersDrawer(false);
        }}
      />
    </div>
  );
}

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function StickyTopBar({
  searchQuery,
  setSearchQuery,
  isSearching,
  totalDisplay,
  totalItems,
  onClearSearch,
  hasFilters,
  onClearAll,
  statusFilter,
  setStatusFilter,
  onOpenMobileFilters,
  children,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isSearching: boolean;
  totalDisplay: number;
  totalItems: number;
  onClearSearch: () => void;
  hasFilters: boolean;
  onClearAll: () => void;
  statusFilter: ItemStatus | "all";
  setStatusFilter: (s: ItemStatus | "all") => void;
  onOpenMobileFilters: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="flex flex-col gap-4 px-3 sm:px-4 lg:px-6 pt-4 pb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search your library…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-16 h-11 rounded-xl border-border bg-card shadow-sm focus:ring-2 focus:ring-ring/20"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {totalDisplay} of {totalItems || totalDisplay}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden h-11 rounded-xl border-border shadow-sm"
              onClick={onOpenMobileFilters}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          {["all", "new", "reviewed", "pinned"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              className={
                statusFilter === status
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                  : "border-border text-muted-foreground bg-card hover:border-muted-foreground/50 hover:text-foreground"
              }
              onClick={() => setStatusFilter(status as ItemStatus | "all")}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {children}

        {hasFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={onClearAll}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveFiltersRow({
  categoryFilter,
  platformFilter,
  tagFilter,
  authorFilter,
  onRemoveFilter,
}: {
  categoryFilter: string[];
  platformFilter: string[];
  tagFilter: string[];
  authorFilter: string[];
  onRemoveFilter: (
    type: "category" | "platform" | "tag" | "author",
    value: string,
  ) => void;
}) {
  const tokens = [
    ...categoryFilter.map((c) => ({ type: "category" as const, label: c })),
    ...platformFilter.map((p) => ({ type: "platform" as const, label: p })),
    ...tagFilter.map((t) => ({ type: "tag" as const, label: t })),
    ...authorFilter.map((a) => ({ type: "author" as const, label: a })),
  ];

  if (!tokens.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {tokens.map((token) => (
        <button
          key={`${token.type}-${token.label}`}
          onClick={() => onRemoveFilter(token.type, token.label)}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground text-sm border border-border"
          aria-label={`Remove ${token.type} ${token.label}`}
        >
          <span className="capitalize">{token.type}:</span>
          <span>{token.label}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}

function FiltersSidebar({
  categories,
  platforms,
  authors,
  tags,
  selectedCategories,
  selectedPlatforms,
  selectedAuthors,
  selectedTags,
  onCategoriesUpdate,
  onPlatformsUpdate,
  onAuthorsUpdate,
  onTagsUpdate,
}: {
  categories: { category: ItemCategory; label: string; count: number }[];
  platforms: { platform: string; count: number }[];
  authors: { author: string; count: number }[];
  tags: { tag: string; count: number }[];
  selectedCategories: string[];
  selectedPlatforms: string[];
  selectedAuthors: string[];
  selectedTags: string[];
  onCategoriesUpdate: (vals: string[]) => void;
  onPlatformsUpdate: (vals: string[]) => void;
  onAuthorsUpdate: (vals: string[]) => void;
  onTagsUpdate: (vals: string[]) => void;
}) {
  const categoryIcons: Record<string, ReactNode> = {
    Technology: <MonitorSmartphone className="w-4 h-4 text-blue-500" />,
    Business: <Briefcase className="w-4 h-4 text-amber-600" />,
    Design: <Palette className="w-4 h-4 text-pink-500" />,
    Productivity: <Zap className="w-4 h-4 text-yellow-500" />,
    Learning: <GraduationCap className="w-4 h-4 text-indigo-500" />,
    Lifestyle: <Coffee className="w-4 h-4 text-emerald-500" />,
    Entertainment: <Film className="w-4 h-4 text-purple-500" />,
    Other: <Sparkles className="w-4 h-4 text-gray-500" />,
  };

  const platformDomainMap: Record<string, string> = {
    linkedin: "linkedin.com",
    twitter: "x.com",
    x: "x.com",
    instagram: "instagram.com",
    reddit: "reddit.com",
    youtube: "youtube.com",
    tiktok: "tiktok.com",
    facebook: "facebook.com",
    medium: "medium.com",
  };

  const resolvePlatformSource = (label: string) => {
    const key = (label || "").toLowerCase();
    if (platformDomainMap[key]) return platformDomainMap[key];
    if (key.includes(".")) return label;
    return `${key}.com`;
  };

  const renderFacet = (
    title: string,
    options: FacetOption[],
    selected: string[],
    onChange: (val: string[]) => void,
    getIcon?: (opt: FacetOption) => ReactNode,
    selectionMode: "multi" | "single" = "multi",
  ) => {
    const cleaned = (options || []).filter((opt) => opt.value && opt.label);
    const top = cleaned.slice(0, 10);
    const selectedNormalized =
      selectionMode === "single" && selected.length > 0
        ? [selected[0]]
        : selected;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <div className="space-y-1">
          {top.map((opt, idx) => (
            <label
              key={opt.value || `${title}-${idx}`}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type={selectionMode === "single" ? "radio" : "checkbox"}
                checked={selectedNormalized.includes(opt.value)}
                onChange={() =>
                  selectionMode === "single"
                    ? onChange([opt.value])
                    : onChange(toggleValue(selectedNormalized, opt.value))
                }
                name={selectionMode === "single" ? `${title}-facet` : undefined}
                aria-label={`${title} ${opt.label}`}
                className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
              />
              {getIcon ? (
                <span className="flex items-center justify-center w-5">
                  {getIcon(opt)}
                </span>
              ) : null}
              <span className="flex-1 truncate flex items-center gap-1">
                {opt.label}
              </span>
              {opt.count !== undefined && (
                <span className="text-xs text-muted-foreground">{opt.count}</span>
              )}
            </label>
          ))}
          {cleaned.length > top.length && (
            <FacetViewAllModal
              title={title}
              options={cleaned}
              selected={selectedNormalized}
              onApply={onChange}
              selectionMode={selectionMode}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-24 space-y-6 bg-card border border-border rounded-xl p-4 shadow-sm">
      {renderFacet(
        "Categories",
        categories.map((c) => ({
          value: c.category,
          label: c.label,
          count: c.count,
        })),
        selectedCategories,
        onCategoriesUpdate,
        (opt) => categoryIcons[opt.label] ?? null,
      )}

      {renderFacet(
        "Sources",
        platforms
          .filter((p) => !!p.platform)
          .map((p) => ({
            value: p.platform,
            label: p.platform,
            count: p.count,
          })),
        selectedPlatforms,
        onPlatformsUpdate,
        (opt) => (
          <div className="scale-90">
            <PlatformIcon source={resolvePlatformSource(opt.label)} size="sm" />
          </div>
        ),
        "single",
      )}

      {renderFacet(
        "Authors",
        authors
          .filter((a) => !!a.author)
          .map((a) => ({
            value: a.author,
            label: a.author,
            count: a.count,
          })),
        selectedAuthors,
        onAuthorsUpdate,
      )}

      {renderFacet(
        "Tags",
        tags
          .filter((t) => !!t.tag)
          .map((t) => ({ value: t.tag, label: t.tag, count: t.count })),
        selectedTags,
        onTagsUpdate,
      )}
    </div>
  );
}

function FiltersDrawer(
  props: Parameters<typeof FiltersSidebar>[0] & {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onClearAll: () => void;
  },
) {
  const { open, onOpenChange, onClearAll, ...rest } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-none w-full rounded-t-2xl sm:rounded-lg left-1/2 sm:translate-x-[-50%] translate-y-0 top-auto bottom-0 sm:top-1/2 sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Narrow results by categories, sources, authors, and tags.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <FiltersSidebar {...rest} />
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onClearAll}>
            Clear all
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemThumbnailCard({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) {
  const image = item.imageUrl || null;
  const fallbackLabel = item.source || "Content";
  const platform = getPlatformInfo(item.source || item.url || "");
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-muted border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={item.title || "View item"}
    >
      <div className="aspect-[3/4] w-full relative">
        <div className="absolute left-2 top-2 z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/90 dark:bg-card/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
            <PlatformIcon source={platform.domain} size="sm" />
            <span className="max-w-[120px] truncate">{platform.name}</span>
          </div>
        </div>
        {image ? (
          <Image
            src={image}
            alt={item.title || fallbackLabel}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            unoptimized={
              image.includes("tiktokcdn") ||
              image.includes("fbcdn.net") ||
              image.includes("cdninstagram.com") ||
              image.toLowerCase().endsWith(".gif")
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground text-sm font-medium">
            {fallbackLabel}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-semibold line-clamp-2">
            {item.title || "Untitled"}
          </p>
        </div>
      </div>
    </button>
  );
}

function FacetViewAllModal({
  title,
  options,
  selected,
  onApply,
  selectionMode = "multi",
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  onApply: (vals: string[]) => void;
  selectionMode?: "multi" | "single";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const normalizedInitial =
    selectionMode === "single" && selected.length > 0
      ? [selected[0]]
      : selected;
  const [localSelected, setLocalSelected] =
    useState<string[]>(normalizedInitial);

  useEffect(() => {
    setLocalSelected(
      selectionMode === "single" && selected.length > 0
        ? [selected[0]]
        : selected,
    );
  }, [selected, selectionMode]);

  const cleaned = (options || []).filter((opt) => opt.value && opt.label);
  const filtered = cleaned.filter((opt) =>
    opt.label!.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View all <ChevronDown className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {selectionMode === "single"
              ? "Select one option"
              : "Select multiple options"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.map((opt, idx) => (
              <label
                key={opt.value || `${title}-modal-${idx}`}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type={selectionMode === "single" ? "radio" : "checkbox"}
                  name={
                    selectionMode === "single"
                      ? `${title}-facet-modal`
                      : undefined
                  }
                  checked={localSelected.includes(opt.value)}
                  onChange={() =>
                    setLocalSelected((prev) =>
                      selectionMode === "single"
                        ? [opt.value]
                        : prev.includes(opt.value)
                          ? prev.filter((p) => p !== opt.value)
                          : [...prev, opt.value],
                    )
                  }
                  className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex-1">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{opt.count}</span>
                )}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setLocalSelected([]);
            }}
          >
            Clear
          </Button>
          <DialogClose asChild>
            <Button
              onClick={() => {
                onApply(localSelected);
                setOpen(false);
              }}
            >
              Done
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
