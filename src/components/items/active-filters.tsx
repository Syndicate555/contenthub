"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveFilter {
  type: "category" | "platform" | "tag" | "author" | "status" | "search";
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-indigo-900">
          Active Filters:
        </span>

        {filters.map((filter, index) => (
          <button
            key={`${filter.type}-${filter.value}-${index}`}
            onClick={filter.onRemove}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-300 hover:bg-indigo-100 transition-colors"
          >
            <span className="text-indigo-600 font-normal">{filter.label}:</span>{" "}
            {filter.value}
            <X className="w-3 h-3 ml-0.5" />
          </button>
        ))}

        <button
          onClick={onClearAll}
          className="ml-auto text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
