"use client";

import { useState } from "react";
import Image from "next/image";
import { PlatformIcon } from "./platform-icon";
import type { EnhancedItem } from "@/hooks/use-items";
import { cn } from "@/lib/utils";

interface ItemCardCompactProps {
  item: EnhancedItem;
  onOpen?: (item: EnhancedItem) => void;
}

export function ItemCardCompact({ item, onOpen }: ItemCardCompactProps) {
  const [imageError, setImageError] = useState(false);
  const created = new Date(item.createdAt);
  const createdText = formatRelativeDate(created);

  return (
    <button
      onClick={() => onOpen?.(item)}
      className="group flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition overflow-hidden text-left"
    >
      <div className="relative aspect-[4/3] bg-muted w-full overflow-hidden">
        {item.imageUrl && !imageError ? (
          <Image
            src={item.imageUrl}
            alt={item.title || "Content preview"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImageError(true)}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 300px, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No preview
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-2 rounded-full bg-white/90 dark:bg-gray-800/90 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
          <PlatformIcon source={item.source || ""} size="sm" />
          <span className="truncate max-w-[140px]">
            {cleanHostname(item.source)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-sm font-semibold text-foreground line-clamp-2 min-h-[40px]">
          {item.title || item.url}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{item.category || "Uncategorized"}</span>
          <span>{createdText}</span>
        </div>
      </div>
    </button>
  );
}

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function cleanHostname(source?: string | null) {
  if (!source) return "Web";
  try {
    const url = new URL(`https://${source.replace(/^https?:\/\//, "")}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return source.replace(/^www\./, "");
  }
}
