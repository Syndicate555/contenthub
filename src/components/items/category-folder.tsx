"use client";

import {
  Cpu,
  Briefcase,
  Palette,
  Zap,
  GraduationCap,
  Heart,
  Film,
  Newspaper,
  Folder,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types";

interface CategoryFolderProps {
  category: ItemCategory;
  label: string;
  icon: string;
  count: number;
  thumbnails: string[];
  titles: string[];
  isSelected?: boolean;
  onClick: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Briefcase,
  Palette,
  Zap,
  GraduationCap,
  Heart,
  Film,
  Newspaper,
  Folder,
};

const categoryColors: Record<
  ItemCategory,
  { bg: string; border: string; text: string; iconBg: string }
> = {
  tech: {
    bg: "bg-blue-50",
    border: "border-blue-200 hover:border-blue-300",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
  },
  business: {
    bg: "bg-emerald-50",
    border: "border-emerald-200 hover:border-emerald-300",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  design: {
    bg: "bg-pink-50",
    border: "border-pink-200 hover:border-pink-300",
    text: "text-pink-700",
    iconBg: "bg-pink-100",
  },
  productivity: {
    bg: "bg-amber-50",
    border: "border-amber-200 hover:border-amber-300",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  learning: {
    bg: "bg-indigo-50",
    border: "border-indigo-200 hover:border-indigo-300",
    text: "text-indigo-700",
    iconBg: "bg-indigo-100",
  },
  lifestyle: {
    bg: "bg-rose-50",
    border: "border-rose-200 hover:border-rose-300",
    text: "text-rose-700",
    iconBg: "bg-rose-100",
  },
  entertainment: {
    bg: "bg-purple-50",
    border: "border-purple-200 hover:border-purple-300",
    text: "text-purple-700",
    iconBg: "bg-purple-100",
  },
  news: {
    bg: "bg-slate-50",
    border: "border-slate-200 hover:border-slate-300",
    text: "text-slate-700",
    iconBg: "bg-slate-100",
  },
  other: {
    bg: "bg-gray-50",
    border: "border-gray-200 hover:border-gray-300",
    text: "text-gray-700",
    iconBg: "bg-gray-100",
  },
};

export function CategoryFolder({
  category,
  label,
  icon,
  count,
  thumbnails,
  titles,
  isSelected,
  onClick,
}: CategoryFolderProps) {
  const Icon = iconMap[icon] || Folder;
  const colors = categoryColors[category];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col rounded-xl border-2 p-4 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-offset-2 ring-gray-900",
      )}
    >
      {/* Thumbnail Preview Grid (2x2) */}
      <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-white/50">
        {thumbnails.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="relative bg-gray-100 overflow-hidden">
                {thumbnails[idx] ? (
                  <img
                    src={thumbnails[idx]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : titles[idx] ? (
                  <div className="absolute inset-0 flex items-center justify-center p-1">
                    <span className="text-[8px] text-gray-400 text-center line-clamp-3">
                      {titles[idx]}
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cn("w-6 h-6 rounded", colors.iconBg)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Icon className={cn("w-12 h-12", colors.text, "opacity-30")} />
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", colors.iconBg)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {label}
          </h3>
          <p className="text-xs text-gray-500">
            {count} item{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />
    </button>
  );
}

export default CategoryFolder;
