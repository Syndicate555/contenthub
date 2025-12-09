"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  clickable?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
}

// Predefined color palette for consistent tag colors
const tagColorPalette = [
  {
    bg: "bg-blue-100",
    text: "text-blue-700",
    hover: "hover:bg-blue-200",
    border: "border-blue-200",
  },
  {
    bg: "bg-green-100",
    text: "text-green-700",
    hover: "hover:bg-green-200",
    border: "border-green-200",
  },
  {
    bg: "bg-purple-100",
    text: "text-purple-700",
    hover: "hover:bg-purple-200",
    border: "border-purple-200",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-700",
    hover: "hover:bg-amber-200",
    border: "border-amber-200",
  },
  {
    bg: "bg-pink-100",
    text: "text-pink-700",
    hover: "hover:bg-pink-200",
    border: "border-pink-200",
  },
  {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    hover: "hover:bg-cyan-200",
    border: "border-cyan-200",
  },
  {
    bg: "bg-orange-100",
    text: "text-orange-700",
    hover: "hover:bg-orange-200",
    border: "border-orange-200",
  },
  {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    hover: "hover:bg-indigo-200",
    border: "border-indigo-200",
  },
  {
    bg: "bg-rose-100",
    text: "text-rose-700",
    hover: "hover:bg-rose-200",
    border: "border-rose-200",
  },
  {
    bg: "bg-teal-100",
    text: "text-teal-700",
    hover: "hover:bg-teal-200",
    border: "border-teal-200",
  },
  {
    bg: "bg-lime-100",
    text: "text-lime-700",
    hover: "hover:bg-lime-200",
    border: "border-lime-200",
  },
  {
    bg: "bg-sky-100",
    text: "text-sky-700",
    hover: "hover:bg-sky-200",
    border: "border-sky-200",
  },
];

// Special category colors for common tag types
const categoryColors: Record<string, (typeof tagColorPalette)[0]> = {
  // Tech-related
  ai: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    hover: "hover:bg-violet-200",
    border: "border-violet-200",
  },
  tech: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    hover: "hover:bg-blue-200",
    border: "border-blue-200",
  },
  programming: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    hover: "hover:bg-blue-200",
    border: "border-blue-200",
  },
  coding: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    hover: "hover:bg-blue-200",
    border: "border-blue-200",
  },

  // Business
  business: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    hover: "hover:bg-emerald-200",
    border: "border-emerald-200",
  },
  startup: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    hover: "hover:bg-emerald-200",
    border: "border-emerald-200",
  },
  finance: {
    bg: "bg-green-100",
    text: "text-green-700",
    hover: "hover:bg-green-200",
    border: "border-green-200",
  },
  investment: {
    bg: "bg-green-100",
    text: "text-green-700",
    hover: "hover:bg-green-200",
    border: "border-green-200",
  },
  "venture capital": {
    bg: "bg-green-100",
    text: "text-green-700",
    hover: "hover:bg-green-200",
    border: "border-green-200",
  },

  // Design
  design: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    hover: "hover:bg-pink-200",
    border: "border-pink-200",
  },
  ui: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    hover: "hover:bg-pink-200",
    border: "border-pink-200",
  },
  ux: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    hover: "hover:bg-pink-200",
    border: "border-pink-200",
  },

  // Marketing
  marketing: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    hover: "hover:bg-orange-200",
    border: "border-orange-200",
  },
  "social media": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    hover: "hover:bg-orange-200",
    border: "border-orange-200",
  },

  // Productivity
  productivity: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    hover: "hover:bg-amber-200",
    border: "border-amber-200",
  },
  tools: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    hover: "hover:bg-amber-200",
    border: "border-amber-200",
  },

  // Learning
  learning: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    hover: "hover:bg-indigo-200",
    border: "border-indigo-200",
  },
  education: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    hover: "hover:bg-indigo-200",
    border: "border-indigo-200",
  },

  // Error states
  processing_failed: {
    bg: "bg-red-100",
    text: "text-red-700",
    hover: "hover:bg-red-200",
    border: "border-red-200",
  },
};

// Generate consistent color based on tag string
function getTagColor(tag: string) {
  const normalizedTag = tag.toLowerCase().trim();

  // Check for category match
  if (categoryColors[normalizedTag]) {
    return categoryColors[normalizedTag];
  }

  // Check for partial category matches
  for (const [category, colors] of Object.entries(categoryColors)) {
    if (normalizedTag.includes(category) || category.includes(normalizedTag)) {
      return colors;
    }
  }

  // Hash-based color selection for consistent colors
  let hash = 0;
  for (let i = 0; i < normalizedTag.length; i++) {
    const char = normalizedTag.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % tagColorPalette.length;
  return tagColorPalette[index];
}

export function TagBadge({
  tag,
  clickable = true,
  size = "sm",
  onClick,
}: TagBadgeProps) {
  const colors = getTagColor(tag);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  const baseClasses = cn(
    "inline-flex items-center rounded-full font-medium border transition-colors",
    colors.bg,
    colors.text,
    colors.border,
    sizeClasses[size],
    clickable && colors.hover,
    clickable && "cursor-pointer",
  );

  if (clickable) {
    // If an onClick is provided, render a button; otherwise fall back to link
    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={baseClasses}>
          {tag}
        </button>
      );
    }

    return (
      <Link
        href={`/items?tag=${encodeURIComponent(tag)}`}
        className={baseClasses}
      >
        {tag}
      </Link>
    );
  }

  return <span className={baseClasses}>{tag}</span>;
}

export default TagBadge;
