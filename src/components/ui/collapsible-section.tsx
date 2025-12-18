"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-900 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          <span className="flex items-center gap-1.5">
            {title}
            {count !== undefined && (
              <span className="text-xs font-normal text-slate-500">
                ({count})
              </span>
            )}
          </span>
        </button>

        {/* Search input (only when open and searchable) */}
        {isOpen && searchable && (
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-7 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && <div className="pl-6">{children}</div>}
    </div>
  );
}
