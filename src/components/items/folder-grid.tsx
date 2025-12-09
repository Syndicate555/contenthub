"use client";

import { CategoryFolder } from "./category-folder";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";
import type { ItemCategory } from "@/types";

interface CategoryData {
  category: ItemCategory;
  label: string;
  icon: string;
  count: number;
  thumbnails: string[];
  titles: string[];
}

interface FolderGridProps {
  categories: CategoryData[];
  selectedCategory: ItemCategory | null;
  onCategorySelect: (category: ItemCategory | null) => void;
  isLoading?: boolean;
  totalItems?: number;
}

export function FolderGrid({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading,
  totalItems = 0,
}: FolderGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          No categories yet
        </h2>
        <p className="text-gray-500">
          Add some content to see your items organized by category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with total count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500">
            {totalItems} total item{totalItems !== 1 ? "s" : ""} across{" "}
            {categories.length} categories
          </p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onCategorySelect(null)}
            className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Grid of folders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <CategoryFolder
            key={cat.category}
            category={cat.category}
            label={cat.label}
            icon={cat.icon}
            count={cat.count}
            thumbnails={cat.thumbnails}
            titles={cat.titles}
            isSelected={selectedCategory === cat.category}
            onClick={() =>
              onCategorySelect(
                selectedCategory === cat.category ? null : cat.category,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

export default FolderGrid;
