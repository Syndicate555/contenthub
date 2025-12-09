"use client";

import { X, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PlatformIcon, getPlatformInfo } from "./platform-icon";
import { ITEM_CATEGORIES, type ItemCategory, type ItemStatus } from "@/types";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  selectedCategory: ItemCategory | null;
  selectedPlatform: string | null;
  selectedStatus: ItemStatus | "all";
  selectedTag: string | null;
  platforms: { platform: string; count: number }[];
  tags?: string[];
  onCategoryChange: (category: ItemCategory | null) => void;
  onPlatformChange: (platform: string | null) => void;
  onStatusChange: (status: ItemStatus | "all") => void;
  onTagChange: (tag: string | null) => void;
  onClearAll: () => void;
}

const statusOptions: { value: ItemStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "pinned", label: "Pinned" },
  { value: "reviewed", label: "Archived" },
];

export function FilterBar({
  selectedCategory,
  selectedPlatform,
  selectedStatus,
  selectedTag,
  platforms,
  tags = [],
  onCategoryChange,
  onPlatformChange,
  onStatusChange,
  onTagChange,
  onClearAll,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedCategory ||
    selectedPlatform ||
    selectedStatus !== "all" ||
    selectedTag;

  const activeFilterCount = [
    selectedCategory,
    selectedPlatform,
    selectedStatus !== "all" ? selectedStatus : null,
    selectedTag,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>

        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8",
                selectedCategory && "bg-gray-100 border-gray-300",
              )}
            >
              {selectedCategory
                ? ITEM_CATEGORIES.find((c) => c.value === selectedCategory)
                    ?.label
                : "Category"}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onCategoryChange(null)}>
              All Categories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ITEM_CATEGORIES.map((cat) => (
              <DropdownMenuItem
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={cn(selectedCategory === cat.value && "bg-gray-100")}
              >
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Platform Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8",
                selectedPlatform && "bg-gray-100 border-gray-300",
              )}
            >
              {selectedPlatform ? (
                <span className="flex items-center gap-1.5">
                  <PlatformIcon source={selectedPlatform} size="sm" />
                  {getPlatformInfo(selectedPlatform).name}
                </span>
              ) : (
                "Platform"
              )}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onPlatformChange(null)}>
              All Platforms
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {platforms.map((p) => (
              <DropdownMenuItem
                key={p.platform}
                onClick={() => onPlatformChange(p.platform)}
                className={cn(
                  "flex items-center gap-2",
                  selectedPlatform === p.platform && "bg-gray-100",
                )}
              >
                <PlatformIcon source={p.platform} size="sm" />
                <span className="flex-1">
                  {getPlatformInfo(p.platform).name}
                </span>
                <span className="text-xs text-gray-400">{p.count}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8",
                selectedStatus !== "all" && "bg-gray-100 border-gray-300",
              )}
            >
              {statusOptions.find((s) => s.value === selectedStatus)?.label}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={cn(selectedStatus === status.value && "bg-gray-100")}
              >
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8",
                  selectedTag && "bg-gray-100 border-gray-300",
                )}
              >
                {selectedTag || "Tag"}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-60 overflow-y-auto"
            >
              <DropdownMenuItem onClick={() => onTagChange(null)}>
                All Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tags.slice(0, 20).map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => onTagChange(tag)}
                  className={cn(selectedTag === tag && "bg-gray-100")}
                >
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-gray-500 hover:text-gray-700"
          >
            Clear all
            <X className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <FilterPill
              label={`Category: ${ITEM_CATEGORIES.find((c) => c.value === selectedCategory)?.label}`}
              onRemove={() => onCategoryChange(null)}
            />
          )}
          {selectedPlatform && (
            <FilterPill
              label={`Platform: ${getPlatformInfo(selectedPlatform).name}`}
              onRemove={() => onPlatformChange(null)}
            />
          )}
          {selectedStatus !== "all" && (
            <FilterPill
              label={`Status: ${statusOptions.find((s) => s.value === selectedStatus)?.label}`}
              onRemove={() => onStatusChange("all")}
            />
          )}
          {selectedTag && (
            <FilterPill
              label={`Tag: ${selectedTag}`}
              onRemove={() => onTagChange(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default FilterBar;
