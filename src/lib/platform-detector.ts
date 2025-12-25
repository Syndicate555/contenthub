/**
 * Platform Detection Service
 *
 * Detects platform-specific metadata from content items for performance optimization.
 * This logic is computed once at write-time and stored in the database.
 */

export interface PlatformData {
  // Platform flags
  isInsta: boolean;
  isTikTok: boolean;
  isYoutube: boolean;
  isLinkedIn: boolean;
  isFb: boolean;

  // Instagram
  instaEmbedUrl: string | null;
  instaSizing: {
    aspectClass: string;
    transformClass: string;
  };
  hasInstaVideo: boolean;

  // TikTok
  tiktokEmbedUrl: string | null;

  // YouTube
  ytEmbedUrl: string | null;
  ytVideoId: string | null;

  // LinkedIn
  liEmbedUrl: string | null;
  liHasDoc: boolean;
  liHasVideo: boolean;

  // Facebook
  fbEmbedUrl: string | null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
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

/**
 * Main platform detection function
 * Computes all platform-specific metadata from item properties
 */
export function detectPlatform(input: {
  url: string;
  source: string | null;
  embedHtml: string | null;
  documentUrl: string | null;
  videoUrl: string | null;
  title: string | null;
  summary: string | null;
}): PlatformData {
  const {
    url,
    source,
    embedHtml,
    documentUrl,
    videoUrl,
    title,
    summary,
  } = input;

  const urlLower = (url || "").toLowerCase();
  const sourceLower = (source || "").toLowerCase();

  // Platform detection flags
  const isInsta = sourceLower.includes("instagram") || urlLower.includes("instagram.com");
  const isTikTok = sourceLower.includes("tiktok") || urlLower.includes("tiktok");
  const isYoutube = sourceLower.includes("youtube") || urlLower.includes("youtu");
  const isLinkedIn = sourceLower.includes("linkedin") || urlLower.includes("linkedin.com");
  const isFb =
    sourceLower.includes("facebook") ||
    urlLower.includes("facebook.com") ||
    urlLower.includes("fb.com") ||
    urlLower.includes("fb.watch");

  // Instagram Logic
  let instaEmbedUrl = null;
  let instaSizing = {
    aspectClass: "aspect-square",
    transformClass: "scale-110 translate-y-[-2%]",
  };
  if (isInsta) {
    try {
      const parts = new URL(url).pathname.split("/").filter(Boolean);
      if (parts[1] && (parts[0] === "reel" || parts[0] === "p" || parts[0] === "tv")) {
        instaEmbedUrl = `https://www.instagram.com/${parts[0]}/${parts[1]}/embed`;
      }
      if (parts[0] === "reel" || parts[0] === "tv") {
        instaSizing = { aspectClass: "aspect-[9/16]", transformClass: "scale-100" };
      }
    } catch {
      // Invalid URL, keep defaults
    }
  }

  // TikTok Logic
  let tiktokEmbedUrl = null;
  if (isTikTok && embedHtml) {
    const match = embedHtml.match(/data-video-id="(\d+)"/);
    if (match?.[1]) {
      tiktokEmbedUrl = `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  }

  // YouTube Logic
  let ytEmbedUrl = null;
  let ytVideoId = null;
  if (isYoutube) {
    ytVideoId = getYoutubeVideoId(url);
    if (ytVideoId) {
      ytEmbedUrl = `https://www.youtube.com/embed/${ytVideoId}?autoplay=1`;
    }
  }

  // LinkedIn Logic
  let liEmbedUrl = null;
  let liHasDoc = false;
  let liHasVideo = false;
  if (isLinkedIn) {
    // Document detection
    liHasDoc = !!documentUrl;
    if (!liHasDoc) {
      // Fallback heuristics
      const content = `${title || ""} ${summary || ""}`.toLowerCase();
      const indicators = ["pdf", "guide", "report", "download", "document", "whitepaper"];
      const hasIndicator = indicators.some((i) => content.includes(i));
      const hasUrlSignal =
        urlLower.includes("/document/") || urlLower.includes("documentid=");
      const hasEmbedSignal = embedHtml?.toLowerCase().includes("document");
      liHasDoc = hasIndicator || hasUrlSignal || !!hasEmbedSignal;
    }

    // Video detection
    liHasVideo = !!videoUrl || urlLower.includes("/video/") || urlLower.includes("activity:");

    // Embed URL
    if (embedHtml) {
      const match = embedHtml.match(/src="([^"]+)"/);
      if (match) liEmbedUrl = match[1];
    }
  }

  // Facebook Logic
  let fbEmbedUrl = null;
  if (isFb && embedHtml) {
    const match = embedHtml.match(/src="([^"]+)"/);
    if (match) fbEmbedUrl = match[1];
  }

  return {
    isInsta,
    isTikTok,
    isYoutube,
    isLinkedIn,
    isFb,
    instaEmbedUrl,
    instaSizing,
    tiktokEmbedUrl,
    ytEmbedUrl,
    ytVideoId,
    liEmbedUrl,
    liHasDoc,
    liHasVideo,
    fbEmbedUrl,
    hasInstaVideo: isInsta && !!videoUrl,
  };
}
