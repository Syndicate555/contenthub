"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { EnhancedItem } from "@/hooks/use-items";
import { cn } from "@/lib/utils";
import { fadeInUp, hoverLift } from "@/lib/animations";

interface ItemCardGamifiedProps {
  item: EnhancedItem;
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

const categoryColors: Record<string, string> = {
  tech: "bg-indigo-100 text-indigo-700 border-indigo-200",
  business: "bg-emerald-100 text-emerald-700 border-emerald-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  productivity: "bg-amber-100 text-amber-700 border-amber-200",
  learning: "bg-purple-100 text-purple-700 border-purple-200",
  lifestyle: "bg-rose-100 text-rose-700 border-rose-200",
  entertainment: "bg-orange-100 text-orange-700 border-orange-200",
  news: "bg-slate-100 text-slate-700 border-slate-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function ItemCardGamified({
  item,
  showActions = true,
  onStatusChange,
  onTagClick,
}: ItemCardGamifiedProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showXpBreakdown, setShowXpBreakdown] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  const TypeIcon = item.type
    ? typeIcons[item.type as keyof typeof typeIcons]
    : Bookmark;
  const typeColor = item.type
    ? typeColors[item.type as keyof typeof typeColors]
    : "bg-gray-100 text-gray-700 border-gray-200";
  const platformInfo = getPlatformInfo(item.source || "");
  const categoryColor = item.category
    ? categoryColors[item.category] || categoryColors.other
    : categoryColors.other;
  const instagramEmbedUrl = useMemo(
    () => getInstagramEmbedUrl(item.url, item.source || undefined),
    [item.url, item.source],
  );
  const instagramSizing = useMemo(
    () => getInstagramEmbedSizing(item.url),
    [item.url],
  );
  const showInstagramEmbed = !!instagramEmbedUrl && !embedFailed;

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
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        {...hoverLift}
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-200",
            "hover:shadow-2xl",
            "border-l-8 relative",
            item.isInFocusArea && item.domain
              ? `shadow-lg`
              : platformInfo.borderColor,
          )}
          style={
            item.isInFocusArea && item.domain
              ? {
                  borderLeftColor: item.domain.color,
                  boxShadow: `0 0 30px ${item.domain.color}40`,
                }
              : undefined
          }
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

          {/* Thumbnail Image (fallback) */}
          {!showInstagramEmbed && item.imageUrl && (
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
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                {/* Platform Icon and Metadata */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <PlatformIcon source={item.source || ""} size="sm" />

                  {item.type && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs border-0 shadow-md font-semibold",
                          item.type === "learn" &&
                            "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
                          item.type === "do" &&
                            "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
                          item.type === "reference" &&
                            "bg-gradient-to-r from-purple-500 to-pink-600 text-white",
                        )}
                      >
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {item.type}
                      </Badge>
                    </motion.div>
                  )}

                  {item.category && (
                    <Badge
                      variant="secondary"
                      className={cn("text-xs border", categoryColor)}
                    >
                      {item.category}
                    </Badge>
                  )}

                  {item.domain && (
                    <Badge
                      variant="secondary"
                      className="text-xs border"
                      style={{
                        backgroundColor: `${item.domain.color}20`,
                        borderColor: `${item.domain.color}40`,
                        color: item.domain.color,
                      }}
                    >
                      <span className="mr-1">{item.domain.icon}</span>
                      {item.domain.displayName}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                  {item.title || item.url}
                </h3>
              </div>

              {/* Date */}
              <span
                className="text-xs text-gray-400 whitespace-nowrap cursor-help"
                title={formatFullDate(item.createdAt)}
              >
                {formatRelativeDate(item.createdAt)}
              </span>
            </div>

            {/* Progress Contribution Section */}
            {(item.domain || item.xpEarned > 0 || item.isInFocusArea) && (
              <div className="space-y-2">
                {/* XP Earned & Domain Contribution */}
                {item.xpEarned > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="relative flex items-center justify-between gap-3 p-3 bg-gradient-xp rounded-lg shadow-md overflow-hidden shimmer"
                  >
                    <div className="flex items-center gap-2 flex-1 relative z-10">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <Zap className="w-5 h-5 text-white fill-current flex-shrink-0 drop-shadow" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-white text-lg drop-shadow">
                            +{item.xpEarned} XP earned
                          </span>
                          {item.domain && (
                            <span className="text-sm text-white/90">
                              →{" "}
                              <span className="font-semibold">
                                {item.domain.displayName}
                              </span>
                            </span>
                          )}
                        </div>
                        {/* XP Breakdown with animations */}
                        {Object.keys(item.xpBreakdown).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                            {Object.entries(item.xpBreakdown).map(
                              ([action, xp], index) => (
                                <motion.span
                                  key={action}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-white/80 text-amber-900 px-2 py-1 rounded-full font-medium"
                                >
                                  {action.replace("_", " ")}: +{xp}
                                </motion.span>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Focus Area Indicator */}
                {item.isInFocusArea && item.domain && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-purple-pink rounded-lg shadow-md relative overflow-hidden"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-white drop-shadow" />
                    </motion.div>
                    <span className="text-sm font-semibold text-white drop-shadow">
                      This is in your focus area • Bonus XP applied
                    </span>
                    {/* Animated shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1,
                      }}
                    />
                  </motion.div>
                )}
              </div>
            )}
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

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.tags.slice(0, 6).map((tag: string) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    clickable={true}
                    onClick={() => onTagClick?.(tag)}
                  />
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
      </motion.div>

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
