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
  Play,
} from "lucide-react";
import { toast } from "sonner";
import type { EnhancedItem } from "@/hooks/use-items";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

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

// Extract YouTube video ID
function getYoutubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("youtube.com")) {
      // Handle /shorts/ path
      if (urlObj.pathname.startsWith("/shorts/")) {
        const pathParts = urlObj.pathname.split("/");
        return pathParts[2] || null;
      }
      // Handle standard watch URL
      return urlObj.searchParams.get("v");
    } else if (hostname.includes("youtu.be")) {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

// Get YouTube Embed URL
function getYoutubeEmbedUrl(url: string): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
}

// Check if it's a LinkedIn post with document
function isLinkedInWithDocument(
  source?: string | null,
  url?: string,
  documentUrl?: string | null,
): boolean {
  const isLinkedIn =
    source?.toLowerCase().includes("linkedin") ||
    url?.toLowerCase().includes("linkedin.com");
  return !!(isLinkedIn && documentUrl);
}

// Detect if LinkedIn post likely has a document based on content
function linkedInLikelyHasDocument(
  source?: string | null,
  url?: string,
  title?: string | null,
  summary?: string | null,
  embedHtml?: string | null,
): boolean {
  const isLinkedIn =
    source?.toLowerCase().includes("linkedin") ||
    url?.toLowerCase().includes("linkedin.com");

  if (!isLinkedIn) return false;

  // Check URL for document patterns
  const urlLower = (url || "").toLowerCase();
  if (
    urlLower.includes("/document/") ||
    urlLower.includes("contentType=document") ||
    urlLower.includes("documentId=")
  ) {
    return true;
  }

  // Check embedHtml for document indicators
  if (embedHtml) {
    const embedLower = embedHtml.toLowerCase();
    if (
      embedLower.includes("document") ||
      embedLower.includes(".pdf") ||
      embedLower.includes("acrobat")
    ) {
      return true;
    }
  }

  // Check content for document keywords (expanded list)
  const content = `${title} ${summary}`.toLowerCase();
  const documentIndicators = [
    "pdf",
    "guide",
    "whitepaper",
    "white paper",
    "ebook",
    "e-book",
    "report",
    "download",
    "pages",
    "document",
    "acrobat",
    "handbook",
    "manual",
    "playbook",
    "template",
    "worksheet",
    "checklist",
    "free download",
    "get the",
    "grab the",
    "download now",
    "read the full",
    "full report",
  ];

  return documentIndicators.some((indicator) => content.includes(indicator));
}

// Check if it's a LinkedIn post with embed HTML
function isLinkedInWithEmbed(
  source?: string | null,
  url?: string,
  embedHtml?: string | null,
): boolean {
  const isLinkedIn =
    source?.toLowerCase().includes("linkedin") ||
    url?.toLowerCase().includes("linkedin.com");
  return !!(isLinkedIn && embedHtml);
}

// Extract LinkedIn embed URL from embedHtml
function getLinkedInEmbedUrl(embedHtml: string): string | null {
  const match = embedHtml.match(/src="([^"]+)"/);
  return match ? match[1] : null;
}

// Check if item is a Facebook post with embed HTML
function isFacebookWithEmbed(
  source?: string | null,
  url?: string | null,
  embedHtml?: string | null,
): boolean {
  const isFacebook =
    source?.toLowerCase().includes("facebook") ||
    url?.toLowerCase().includes("facebook.com") ||
    url?.toLowerCase().includes("fb.com") ||
    url?.toLowerCase().includes("fb.watch");
  return !!(isFacebook && embedHtml);
}

// Extract Facebook embed URL from embedHtml
function getFacebookEmbedUrl(embedHtml: string): string | null {
  const match = embedHtml.match(/src="([^"]+)"/);
  return match ? match[1] : null;
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showXpBreakdown, setShowXpBreakdown] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [playYoutube, setPlayYoutube] = useState(false);

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
  const tiktokEmbedUrl = useMemo(() => {
    const isTikTok =
      item.source?.toLowerCase().includes("tiktok") ||
      item.url.toLowerCase().includes("tiktok");
    const url = getTikTokEmbedUrl(
      item.url,
      item.source || undefined,
      item.embedHtml,
    );

    if (isTikTok) {
      console.log("[TikTok ItemCardGamified]", {
        itemId: item.id,
        title: item.title?.substring(0, 50),
        hasEmbedHtml: !!item.embedHtml,
        embedHtmlLength: item.embedHtml?.length,
        generatedUrl: url,
        willShow: !!url && !embedFailed,
      });
    }

    return url;
  }, [item.url, item.source, item.embedHtml, item.id, item.title, embedFailed]);
  const showTikTokEmbed = !!tiktokEmbedUrl && !embedFailed;

  const isYoutube =
    item.source?.includes("youtube") || item.url.includes("youtu");
  const youtubeVideoId = useMemo(
    () => (isYoutube ? getYoutubeVideoId(item.url) : null),
    [isYoutube, item.url],
  );
  const youtubeEmbedUrl = useMemo(
    () => (isYoutube ? getYoutubeEmbedUrl(item.url) : null),
    [isYoutube, item.url],
  );

  const hasLinkedInDocument = useMemo(() => {
    const result = isLinkedInWithDocument(
      item.source,
      item.url,
      item.documentUrl,
    );
    if (
      item.source?.toLowerCase().includes("linkedin") ||
      item.url.toLowerCase().includes("linkedin")
    ) {
      console.log("[LinkedIn Debug]", {
        itemId: item.id,
        title: item.title?.substring(0, 50),
        hasDocumentUrl: !!item.documentUrl,
        documentUrl: item.documentUrl,
        hasLinkedInDocument: result,
      });
    }
    return result;
  }, [item.source, item.url, item.documentUrl, item.id, item.title]);

  const linkedInEmbedUrl = useMemo(() => {
    if (!isLinkedInWithEmbed(item.source, item.url, item.embedHtml)) {
      return null;
    }
    const url = getLinkedInEmbedUrl(item.embedHtml!);
    console.log("[LinkedIn Embed Debug]", {
      itemId: item.id,
      title: item.title?.substring(0, 50),
      hasEmbedHtml: !!item.embedHtml,
      embedUrl: url,
    });
    return url;
  }, [item.source, item.url, item.embedHtml, item.id, item.title]);

  const linkedInHasDocument = useMemo(
    () =>
      linkedInLikelyHasDocument(
        item.source,
        item.url,
        item.title,
        item.summary,
        item.embedHtml,
      ),
    [item.source, item.url, item.title, item.summary, item.embedHtml],
  );

  // Detect if LinkedIn post has a video
  const linkedInHasVideo = useMemo(() => {
    const isLinkedIn =
      item.source?.toLowerCase().includes("linkedin") ||
      item.url?.toLowerCase().includes("linkedin.com");
    if (!isLinkedIn) return false;

    // Primary indicator: check if videoUrl field is populated (most reliable)
    if (item.videoUrl) {
      return true;
    }

    // Secondary: Check URL for video patterns
    if (
      item.url.includes("/video/") ||
      item.url.includes("activity:") ||
      item.url.includes("ugcPost:")
    ) {
      return true;
    }

    // Tertiary: Check title/summary for strong video keywords
    const content = `${item.title} ${item.summary}`.toLowerCase();
    const videoKeywords = [
      "播放", // "play" in Chinese
      "視頻", // "video" in Chinese
    ];

    return videoKeywords.some((keyword) => content.includes(keyword));
  }, [item.source, item.url, item.videoUrl, item.title, item.summary]);

  // Show LinkedIn embed for ALL LinkedIn posts that have embedHtml
  // No complex detection - just show the embed for everything
  const showLinkedInEmbed = !!linkedInEmbedUrl && !embedFailed;

  // Facebook embed URL extraction and state
  const facebookEmbedUrl = useMemo(() => {
    if (!isFacebookWithEmbed(item.source, item.url, item.embedHtml)) {
      return null;
    }
    const url = getFacebookEmbedUrl(item.embedHtml!);
    console.log("[Facebook Embed Debug]", {
      itemId: item.id,
      title: item.title?.substring(0, 50),
      hasEmbedHtml: !!item.embedHtml,
      embedUrl: url,
    });
    return url;
  }, [item.source, item.url, item.embedHtml, item.id, item.title]);

  const showFacebookEmbed = !!facebookEmbedUrl && !embedFailed;

  // Debug logging for Facebook posts
  if (
    item.source?.toLowerCase().includes("facebook") ||
    item.url?.toLowerCase().includes("facebook.com") ||
    item.url?.toLowerCase().includes("fb.com") ||
    item.url?.toLowerCase().includes("fb.watch")
  ) {
    console.log("[Facebook Post Debug]", {
      itemId: item.id,
      title: item.title?.substring(0, 50),
      url: item.url?.substring(0, 80),
      hasImageUrl: !!item.imageUrl,
      hasVideoUrl: !!item.videoUrl,
      hasEmbedHtml: !!item.embedHtml,
      embedHtmlLength: item.embedHtml?.length || 0,
      embedHtmlPreview: item.embedHtml?.substring(0, 150),
      facebookEmbedUrl,
      showFacebookEmbed,
      embedFailed,
    });
  }

  // Debug logging for LinkedIn posts
  if (
    item.source?.toLowerCase().includes("linkedin") ||
    item.url?.toLowerCase().includes("linkedin.com")
  ) {
    console.log("[LinkedIn Post Debug]", {
      itemId: item.id,
      title: item.title?.substring(0, 50),
      url: item.url?.substring(0, 80),
      hasImageUrl: !!item.imageUrl,
      hasVideoUrl: !!item.videoUrl,
      hasDocumentUrl: !!item.documentUrl,
      hasEmbedHtml: !!item.embedHtml,
      linkedInEmbedUrl,
      showLinkedInEmbed,
    });
  }

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
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
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

          {/* LinkedIn embed for posts with videos/documents */}
          {showLinkedInEmbed ? (
            <div className="w-full bg-gray-50 py-4">
              {/* Hint to scroll for video/document/content */}
              <div className="flex justify-center mb-2 gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {linkedInHasDocument
                    ? "Scroll to view document"
                    : linkedInHasVideo
                      ? "Scroll to play video"
                      : "Scroll to view full content"}
                </div>
                {/* View Image Fullscreen button (if post has an image) */}
                {item.imageUrl && (
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                    View Image Fullscreen
                  </button>
                )}
              </div>
              <div className="flex justify-center">
                <iframe
                  src={linkedInEmbedUrl!}
                  className="w-full max-w-[504px] h-[700px] border-0"
                  allowFullScreen
                  scrolling="yes"
                  title="LinkedIn post"
                  onError={() => setEmbedFailed(true)}
                />
              </div>
            </div>
          ) : null}

          {/* Facebook embed for posts */}
          {showFacebookEmbed ? (
            <div className="w-full bg-gray-50 py-6 px-4">
              {/* Hint to scroll for content and View Image button */}
              <div className="flex flex-wrap justify-center items-center mb-4 gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {item.videoUrl
                    ? "Scroll or click to play video"
                    : "Scroll to view full content"}
                </div>
                {/* View Video Fullscreen button (if post has a video) */}
                {item.videoUrl && (
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                    View Video Fullscreen
                  </button>
                )}
                {/* View Image Fullscreen button (if post has an image) */}
                {item.imageUrl && (
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                    View Image Fullscreen
                  </button>
                )}
              </div>
              <div className="flex justify-center">
                <iframe
                  src={facebookEmbedUrl!}
                  className="w-full max-w-[500px] h-[600px] border-0"
                  allowFullScreen
                  scrolling="no"
                  title="Facebook post"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  onError={() => setEmbedFailed(true)}
                />
              </div>
            </div>
          ) : null}

          {/* YouTube Embed / Facade */}
          {isYoutube && youtubeVideoId && !embedFailed && (
            <div className="w-full aspect-video bg-black relative group">
              {playYoutube ? (
                <div className="absolute inset-0 w-full h-full">
                  <iframe
                    className="w-full h-full"
                    src={youtubeEmbedUrl!}
                    title={item.title || "YouTube video"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onError={() => setEmbedFailed(true)}
                  ></iframe>
                </div>
              ) : (
                <button
                  onClick={() => setPlayYoutube(true)}
                  className="w-full h-full relative block cursor-pointer group"
                >
                  <Image
                    src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to hqdefault if maxres doesn't exist
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes("maxresdefault")) {
                        img.src = img.src.replace("maxresdefault", "hqdefault");
                      } else {
                        setEmbedFailed(true);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* LinkedIn Document - with fallback for detected documents */}
          {(hasLinkedInDocument ||
            (linkedInHasDocument && showLinkedInEmbed)) &&
            !embedFailed && (
              <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 border-y border-blue-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        📄 PDF Document Detected
                      </p>
                      <p className="text-sm text-gray-600">
                        {hasLinkedInDocument
                          ? "Click to download or view the PDF"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Thumbnail Image (shows for regular images, including LinkedIn image-only posts) */}
          {!showInstagramEmbed &&
            !showTikTokEmbed &&
            !showLinkedInEmbed &&
            !showFacebookEmbed &&
            !isYoutube &&
            !hasLinkedInDocument &&
            item.imageUrl && (
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="block w-full relative bg-gray-50 overflow-hidden cursor-zoom-in group min-h-[200px] max-h-80"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Content preview"}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-80 object-contain"
                  loading="lazy"
                  quality={85}
                  unoptimized={
                    (item.imageUrl || "").toLowerCase().endsWith(".gif") ||
                    item.source?.includes("linkedin") ||
                    item.source?.includes("reddit")
                  }
                  onError={(e) => {
                    (
                      e.target as HTMLImageElement
                    ).parentElement!.style.display = "none";
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

                {/* Author subtitle */}
                {item.author && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    by {item.author}
                  </p>
                )}
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

      {/* Facebook Video Modal */}
      {showFacebookEmbed && item.videoUrl && isVideoModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl h-full max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-3">
              <button
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
                onClick={() => setIsVideoModalOpen(false)}
                aria-label="Close fullscreen"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <iframe
                src={facebookEmbedUrl!}
                className="w-full h-full border-0 rounded-lg bg-gray-900"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                scrolling="yes"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
