"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageModal } from "@/components/ui/image-modal";
import { PlatformIcon, getPlatformInfo } from "./platform-icon";
import { TagBadge } from "./tag-badge";
import {
  ExternalLink,
  Pin,
  Archive,
  Trash2,
  BookOpen,
  Wrench,
  Bookmark,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Item } from "@/generated/prisma";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  showActions?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onTagClick?: (tag: string) => void;
}

// Build an Instagram embed URL (for reels/posts) so we can play the hosted video inline
function getInstagramEmbedUrl(url: string, source?: string) {
  const isInstagram =
    source?.toLowerCase().includes("instagram") ||
    url.toLowerCase().includes("instagram.com");
  if (!isInstagram) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const type = parts[0];
    const id = parts[1];

    if (!id) return null;
    if (type === "reel" || type === "p" || type === "tv") {
      return `https://www.instagram.com/${type}/${id}/embed`;
    }
  } catch {
    // ignore parse errors
  }

  return null;
}

// Heuristic sizing/cropping so square posts don't leave huge whitespace
function getInstagramEmbedSizing(url: string) {
  const parts = (() => {
    try {
      const parsed = new URL(url);
      return parsed.pathname.split("/").filter(Boolean);
    } catch {
      return [];
    }
  })();
  const type = parts[0];

  if (type === "reel" || type === "tv") {
    return {
      aspectClass: "aspect-[9/16]",
      transformClass: "scale-100",
    };
  }

  // Default for feed posts (often square/landscape): tighter crop
  return {
    aspectClass: "aspect-square",
    transformClass: "scale-110 translate-y-[-2%]",
  };
}

// Extract TikTok video ID from embedHtml
function extractTikTokVideoId(embedHtml: string): string | null {
  const videoIdMatch = embedHtml.match(/data-video-id="(\d+)"/);
  return videoIdMatch ? videoIdMatch[1] : null;
}

// Check if item is a TikTok video and return iframe URL
function getTikTokEmbedUrl(
  url: string,
  source?: string,
  embedHtml?: string | null,
): string | null {
  const isTikTok =
    source?.toLowerCase().includes("tiktok") ||
    url.toLowerCase().includes("tiktok.com");
  if (!isTikTok || !embedHtml) return null;

  const videoId = extractTikTokVideoId(embedHtml);
  if (!videoId) return null;

  // Use TikTok's iframe embed URL directly
  return `https://www.tiktok.com/embed/v2/${videoId}`;
}

const typeIcons = {
  learn: BookOpen,
  do: Wrench,
  reference: Bookmark,
};

const typeColors = {
  learn: "bg-blue-100 text-blue-700 border-blue-200",
  do: "bg-green-100 text-green-700 border-green-200",
  reference: "bg-purple-100 text-purple-700 border-purple-200",
};

export function ItemCard({
  item,
  showActions = true,
  onStatusChange,
  onTagClick,
}: ItemCardProps) {
  // DEBUG: Log every item render
  console.log("[ItemCard] Rendering:", {
    id: item.id,
    title: item.title?.substring(0, 50),
    isTikTok:
      item.source?.toLowerCase().includes("tiktok") ||
      item.url.toLowerCase().includes("tiktok"),
    hasEmbedHtml: !!item.embedHtml,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  const TypeIcon = item.type
    ? typeIcons[item.type as keyof typeof typeIcons]
    : Bookmark;
  const typeColor = item.type
    ? typeColors[item.type as keyof typeof typeColors]
    : "bg-gray-100 text-gray-700 border-gray-200";
  const platformInfo = getPlatformInfo(item.source || "");
  const instagramEmbedUrl = useMemo(
    () => getInstagramEmbedUrl(item.url, item.source || undefined),
    [item.url, item.source],
  );
  const instagramSizing = useMemo(
    () => getInstagramEmbedSizing(item.url),
    [item.url],
  );
  const showInstagramEmbed = !!instagramEmbedUrl && !embedFailed;
  const tiktokEmbedUrl = useMemo(() => {
    const url = getTikTokEmbedUrl(
      item.url,
      item.source || undefined,
      item.embedHtml,
    );
    if (
      item.source?.toLowerCase().includes("tiktok") ||
      item.url.toLowerCase().includes("tiktok")
    ) {
      console.log("[TikTok Debug]", {
        itemId: item.id,
        title: item.title,
        hasEmbedHtml: !!item.embedHtml,
        embedHtmlLength: item.embedHtml?.length,
        generatedUrl: url,
      });
    }
    return url;
  }, [item.url, item.source, item.embedHtml, item.id, item.title]);
  const showTikTokEmbed = !!tiktokEmbedUrl && !embedFailed;

  const handleStatusChange = async (status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const statusMessages = {
        pinned: "Pinned",
        reviewed: "Archived",
        deleted: "Deleted",
      };

      toast.success(
        statusMessages[status as keyof typeof statusMessages] || "Updated",
      );
      onStatusChange?.(item.id, status);
    } catch {
      toast.error("Failed to update item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Format date as relative time
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const summaryBullets = item.summary?.split("\n").filter(Boolean) || [];

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200",
          "hover:shadow-lg hover:border-gray-300",
          "border-l-4",
          platformInfo.borderColor,
        )}
      >
        {/* Instagram embed for reels/posts (uses hosted source) */}
        {showInstagramEmbed ? (
          <div className="w-full bg-black overflow-hidden relative rounded-b-none">
            <div className={`relative w-full ${instagramSizing.aspectClass}`}>
              <iframe
                src={instagramEmbedUrl!}
                className={`absolute inset-0 w-full h-full border-0 ${instagramSizing.transformClass} origin-top`}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                onError={() => setEmbedFailed(true)}
              />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => setIsEmbedModalOpen(true)}
              >
                View full
              </Button>
            </div>
          </div>
        ) : null}

        {/* TikTok embed for videos (uses iframe) */}
        {showTikTokEmbed ? (
          <div className="w-full flex justify-center bg-gray-50 py-4">
            <iframe
              src={tiktokEmbedUrl}
              className="w-full max-w-[325px] h-[730px] border-0"
              allowFullScreen
              scrolling="no"
              allow="encrypted-media;"
              onError={() => setEmbedFailed(true)}
            />
          </div>
        ) : null}

        {/* Thumbnail Image - Click to open modal (fallback) */}
        {!showInstagramEmbed && !showTikTokEmbed && item.imageUrl && (
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="block w-full relative bg-gray-50 overflow-hidden cursor-zoom-in group min-h-[200px] max-h-80"
          >
            <Image
              src={item.imageUrl}
              alt={item.title || "Content preview"}
              width={800}
              height={600}
              className="w-full h-auto max-h-80 object-contain group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
              quality={85}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display =
                  "none";
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </button>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Platform Icon and Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <PlatformIcon source={item.source || ""} size="sm" />
                {item.type && (
                  <Badge
                    variant="secondary"
                    className={cn("text-xs border", typeColor)}
                  >
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {item.type}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                {item.title || item.url}
              </h3>
            </div>

            {/* Date with tooltip */}
            <span
              className="text-xs text-gray-400 whitespace-nowrap cursor-help"
              title={formatFullDate(item.createdAt)}
            >
              {formatRelativeDate(item.createdAt)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Summary */}
          {summaryBullets.length > 0 && (
            <ul className="text-sm text-gray-600 space-y-1.5 mb-3">
              {summaryBullets.slice(0, 5).map((bullet: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Tags - Color coded and clickable */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.slice(0, 6).map((tag: string) => (
                <TagBadge key={tag} tag={tag} clickable={true} />
              ))}
              {item.tags.length > 6 && (
                <span className="text-xs text-gray-400 self-center">
                  +{item.tags.length - 6} more
                </span>
              )}
            </div>
          )}

          {/* Note */}
          {item.note && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg mb-3">
              <MessageSquare className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{item.note}</p>
            </div>
          )}

          {/* View Original Button */}
          <div className="flex items-center gap-2 mb-3">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Original
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-7 px-2 text-gray-500 hover:text-gray-700"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("pinned")}
                disabled={isUpdating}
                className="flex-1 h-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <Pin className="w-4 h-4 mr-1.5" />
                Pin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("reviewed")}
                disabled={isUpdating}
                className="flex-1 h-9 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Archive className="w-4 h-4 mr-1.5" />
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("deleted")}
                disabled={isUpdating}
                className="flex-1 h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={item.imageUrl || ""}
        alt={item.title || "Content preview"}
        sourceUrl={item.url}
      />
      {showInstagramEmbed && isEmbedModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEmbedModalOpen(false)}
        >
          <div
            className="bg-black rounded-xl shadow-2xl w-full max-w-[520px] aspect-[9/16] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={instagramEmbedUrl!}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
            <button
              className="absolute top-2 right-2 text-white/80 hover:text-white transition"
              onClick={() => setIsEmbedModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
