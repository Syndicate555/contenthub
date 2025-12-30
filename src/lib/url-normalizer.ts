/**
 * URL Normalization Utilities
 *
 * Normalizes URLs to canonical forms for consistent metadata extraction,
 * deduplication, and platform API compatibility.
 *
 * Each platform has specific normalization rules to ensure:
 * - API endpoints receive expected URL formats
 * - Duplicate detection works correctly
 * - User experience is seamless regardless of URL variations
 */

/**
 * Normalizes Twitter/X URLs to canonical form.
 *
 * Handles common variations:
 * - /photo/1, /photo/2, etc. → removed (photo viewer URLs)
 * - /video/1 → removed (video viewer URLs)
 * - /analytics → removed (analytics overlay URLs)
 * - x.com → twitter.com (for API compatibility)
 * - Query parameters → removed (tracking, share params)
 * - Hash fragments → removed
 * - Trailing slashes → normalized
 *
 * @example
 * // Photo viewer URL
 * normalizeTwitterUrl('https://x.com/user/status/123/photo/1')
 * // => 'https://twitter.com/user/status/123'
 *
 * @example
 * // Video viewer URL
 * normalizeTwitterUrl('https://twitter.com/user/status/456/video/1')
 * // => 'https://twitter.com/user/status/456'
 *
 * @example
 * // Analytics URL
 * normalizeTwitterUrl('https://x.com/user/status/789/analytics')
 * // => 'https://twitter.com/user/status/789'
 */
function normalizeTwitterUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname: x.com → twitter.com
    if (urlObj.hostname.includes("x.com")) {
      urlObj.hostname = urlObj.hostname.replace("x.com", "twitter.com");
    }

    // Extract base tweet path: /username/status/1234567890
    // Remove suffixes: /photo/1, /photo/2, /video/1, /analytics, etc.
    const tweetPathMatch = urlObj.pathname.match(/^(\/[^\/]+\/status\/\d+)/);

    if (tweetPathMatch) {
      urlObj.pathname = tweetPathMatch[1];
    }

    // Remove query parameters (tracking, share params, etc.)
    urlObj.search = "";

    // Remove hash fragments
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    return url;
  }
}

/**
 * Normalizes Instagram URLs to canonical form.
 *
 * Handles:
 * - /p/POST_ID/ → canonical post URL
 * - /reel/POST_ID/ → canonical reel URL
 * - /tv/POST_ID/ → canonical IGTV URL
 * - Removes /embed/ suffixes
 * - www.instagram.com → instagram.com
 * - m.instagram.com → instagram.com (mobile)
 * - Query parameters → removed
 *
 * @example
 * normalizeInstagramUrl('https://www.instagram.com/p/ABC123/embed/')
 * // => 'https://instagram.com/p/ABC123/'
 */
function normalizeInstagramUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname: remove www., m., etc.
    urlObj.hostname = "instagram.com";

    // Extract base path: /p/POST_ID or /reel/POST_ID or /tv/POST_ID
    const match = urlObj.pathname.match(/^\/(p|reel|tv)\/([^\/]+)/);

    if (match) {
      // Canonical form: /type/id/
      urlObj.pathname = `/${match[1]}/${match[2]}/`;
    }

    // Remove query parameters
    urlObj.search = "";
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Normalizes Reddit URLs to canonical form.
 *
 * Handles:
 * - Removes ?context=N parameter (breaks some embeds)
 * - Removes tracking parameters (utm_*, share_id, etc.)
 * - www.reddit.com → reddit.com
 * - old.reddit.com → reddit.com
 * - Preserves comment thread structure
 *
 * @example
 * normalizeRedditUrl('https://www.reddit.com/r/foo/comments/abc/?context=3')
 * // => 'https://reddit.com/r/foo/comments/abc/'
 */
function normalizeRedditUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname variations
    if (
      urlObj.hostname === "www.reddit.com" ||
      urlObj.hostname === "old.reddit.com" ||
      urlObj.hostname === "new.reddit.com"
    ) {
      urlObj.hostname = "reddit.com";
    }

    // Remove problematic query parameters
    const searchParams = new URLSearchParams(urlObj.search);
    searchParams.delete("context");
    searchParams.delete("utm_source");
    searchParams.delete("utm_medium");
    searchParams.delete("utm_campaign");
    searchParams.delete("utm_content");
    searchParams.delete("share_id");

    urlObj.search = searchParams.toString();
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Normalizes YouTube URLs to canonical form.
 *
 * Handles:
 * - youtu.be/VIDEO_ID → youtube.com/watch?v=VIDEO_ID
 * - /shorts/VIDEO_ID → /watch?v=VIDEO_ID
 * - Preserves video ID (v parameter)
 * - Preserves timestamp (t parameter) if present
 * - Removes tracking parameters
 *
 * @example
 * normalizeYoutubeUrl('https://youtu.be/dQw4w9WgXcQ?si=abc123')
 * // => 'https://youtube.com/watch?v=dQw4w9WgXcQ'
 *
 * @example
 * normalizeYoutubeUrl('https://youtube.com/shorts/abc123')
 * // => 'https://youtube.com/watch?v=abc123'
 */
function normalizeYoutubeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname
    if (urlObj.hostname.includes("youtu.be")) {
      urlObj.hostname = "youtube.com";
      // Extract video ID from path
      const videoId = urlObj.pathname.slice(1); // Remove leading /
      urlObj.pathname = "/watch";
      urlObj.searchParams.set("v", videoId);
    } else if (urlObj.pathname.startsWith("/shorts/")) {
      // Convert /shorts/VIDEO_ID to /watch?v=VIDEO_ID
      const videoId = urlObj.pathname.replace("/shorts/", "");
      urlObj.pathname = "/watch";
      urlObj.searchParams.set("v", videoId);
    }

    // Extract essential parameters only
    const videoId = urlObj.searchParams.get("v");
    const timestamp = urlObj.searchParams.get("t");

    if (videoId) {
      const newParams = new URLSearchParams();
      newParams.set("v", videoId);
      if (timestamp) {
        newParams.set("t", timestamp);
      }
      urlObj.search = newParams.toString();
    }

    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Normalizes TikTok URLs to canonical form.
 *
 * Handles:
 * - Preserves /@username/video/VIDEO_ID structure
 * - Removes /embed suffixes
 * - Optionally preserves is_from_webapp parameter
 * - Removes tracking parameters
 *
 * @example
 * normalizeTikTokUrl('https://www.tiktok.com/@user/video/123?is_from_webapp=1&sender_device=pc')
 * // => 'https://tiktok.com/@user/video/123'
 */
function normalizeTikTokUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname
    urlObj.hostname = "tiktok.com";

    // Extract base video path: /@username/video/VIDEO_ID
    const match = urlObj.pathname.match(/^(\/@[^\/]+\/video\/\d+)/);

    if (match) {
      urlObj.pathname = match[1];
    }

    // Remove all query parameters (they're not needed for metadata extraction)
    urlObj.search = "";
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Normalizes LinkedIn URLs to canonical form.
 *
 * Handles:
 * - Removes tracking parameters
 * - Normalizes www.linkedin.com → linkedin.com
 * - Preserves post/activity structure
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname
    if (urlObj.hostname === "www.linkedin.com") {
      urlObj.hostname = "linkedin.com";
    }

    // Remove tracking parameters
    const searchParams = new URLSearchParams(urlObj.search);
    searchParams.delete("utm_source");
    searchParams.delete("utm_medium");
    searchParams.delete("utm_campaign");
    searchParams.delete("trk");
    searchParams.delete("trackingId");

    urlObj.search = searchParams.toString();
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Generic URL normalization for non-platform-specific URLs.
 *
 * Applies basic normalization:
 * - Removes common tracking parameters (utm_*, fbclid, gclid, etc.)
 * - Removes hash fragments
 * - Normalizes www. prefix
 * - Normalizes trailing slashes
 *
 * @example
 * normalizeGenericUrl('https://www.example.com/article/?utm_source=twitter#comments')
 * // => 'https://example.com/article/'
 */
function normalizeGenericUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove www. prefix (optional, can be kept for some sites)
    // Comment this out if you want to preserve www.
    if (urlObj.hostname.startsWith("www.")) {
      urlObj.hostname = urlObj.hostname.slice(4);
    }

    // Remove common tracking parameters
    const searchParams = new URLSearchParams(urlObj.search);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "source",
    ];

    trackingParams.forEach((param) => searchParams.delete(param));

    urlObj.search = searchParams.toString();

    // Remove hash fragments
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Main URL normalization function.
 *
 * Detects platform and applies appropriate normalization.
 * Falls back to generic normalization for unknown platforms.
 *
 * @param url - The URL to normalize
 * @returns Normalized canonical URL
 *
 * @example
 * normalizeUrl('https://x.com/user/status/123/photo/1')
 * // => 'https://twitter.com/user/status/123'
 *
 * @example
 * normalizeUrl('https://www.instagram.com/p/ABC/embed/')
 * // => 'https://instagram.com/p/ABC/'
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Twitter/X
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return normalizeTwitterUrl(url);
    }

    // Instagram
    if (hostname.includes("instagram.com")) {
      return normalizeInstagramUrl(url);
    }

    // Reddit
    if (hostname.includes("reddit.com")) {
      return normalizeRedditUrl(url);
    }

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return normalizeYoutubeUrl(url);
    }

    // TikTok
    if (hostname.includes("tiktok.com")) {
      return normalizeTikTokUrl(url);
    }

    // LinkedIn
    if (hostname.includes("linkedin.com")) {
      return normalizeLinkedInUrl(url);
    }

    // Generic normalization for other platforms
    return normalizeGenericUrl(url);
  } catch (error) {
    // If any error occurs, return original URL
    return url;
  }
}

/**
 * Type guard to check if a URL is valid.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
