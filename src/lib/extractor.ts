import { Readability } from "@mozilla/readability";
import { fetchWithTimeout } from "./utils/timeout";
import { YoutubeTranscript } from "youtube-transcript";

export interface ExtractedContent {
  title: string;
  content: string;
  source: string;
  author?: string;
  imageUrl?: string;
  videoUrl?: string;
  embedHtml?: string; // Embed HTML for video platforms (TikTok, etc.)
  imageSource?: "oembed" | "microlink" | "og" | "scrape"; // Track where the image came from
}

// Simple HTML stripper for small snippets (avoids jsdom on serverless)
function stripHtmlPreserveBreaks(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n");
  return withBreaks
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Safe, lazy loader for JSDOM that gracefully fails in environments where ESM/CJS interop is problematic
async function loadJSDOMSafe() {
  try {
    const mod = await import("jsdom");
    return mod.JSDOM;
  } catch (err) {
    console.error("JSDOM load failed; continuing without DOM parsing", err);
    return null;
  }
}

/**
 * Detects the platform from a URL
 */
function detectPlatform(
  url: string,
): "twitter" | "instagram" | "linkedin" | "tiktok" | "youtube" | "reddit" | "generic" {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return "twitter";
  }
  if (hostname.includes("instagram.com")) {
    return "instagram";
  }
  if (hostname.includes("linkedin.com")) {
    return "linkedin";
  }
  if (hostname.includes("tiktok.com")) {
    return "tiktok";
  }
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return "youtube";
  }
  if (hostname.includes("reddit.com") || hostname.includes("redd.it")) {
    return "reddit";
  }
  return "generic";
}

/**
 * Extract tweet ID from Twitter/X URL
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract YouTube Video ID from URL
 */
function extractYoutubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*$/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extract content from YouTube video
 */
async function extractYoutubeContent(url: string): Promise<ExtractedContent> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const source = "youtube.com";
  let title = "YouTube Video";
  let author = "Unknown Channel";
  let transcriptText = "";

  try {
    const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(oembedUrl);
    const data = await res.json();
    
    title = data.title || title;
    author = data.author_name || author;
  } catch (e) {
    console.error("YouTube oEmbed failed", e);
  }

  try {
    console.log(`[YouTube] Fetching transcript for ${videoId}`);
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    transcriptText = transcriptItems.map(t => t.text).join(' ');
  } catch (e) {
    console.log("Could not fetch transcript (might be disabled):", e);
  }

  const content = transcriptText.length > 50 
    ? transcriptText 
    : `Video Title: ${title}. Author: ${author}. (Transcript unavailable)`;

  return {
    title,
    content,
    source,
    author,
    imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedHtml: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
  };
}

/**
 * Extract content from Reddit
 * Uses Reddit's public .json API with fallbacks
 */
async function extractRedditContent(url: string): Promise<ExtractedContent> {
  const source = "reddit.com";

  // Clean URL to ensure we can append .json correctly
  const urlBase = url.split("?")[0];
  const urlNoSlash = urlBase.replace(new RegExp("/+"), "");
  const cleanUrl = urlNoSlash.replace("old.reddit.com", "www.reddit.com");

  const jsonUrl = `${cleanUrl}.json`;

  const BROWSER_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  const processJson = (data: any) => {
    // Redlib/Reddit response normalization
    const listing = Array.isArray(data) ? data[0] : data;

    if (!listing?.data?.children?.[0]?.data) {
      throw new Error("Invalid Reddit API response");
    }

    let post = listing.data.children[0].data;

    if (post.crosspost_parent_list && post.crosspost_parent_list.length > 0) {
      post = post.crosspost_parent_list[0];
    }

    const title = post.title;
    const author = `u/${post.author}`;
    const subreddit = post.subreddit_name_prefixed;
    const textContent = post.selftext || "";
    const content = `[${subreddit}] ${title}\n\n${textContent}`;

    let imageUrl: string | undefined;

    if (post.url_overridden_by_dest) {
      if (
        /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(post.url_overridden_by_dest)
      ) {
        imageUrl = post.url_overridden_by_dest;
      } else if (post.domain === "i.imgur.com") {
        imageUrl = post.url_overridden_by_dest.endsWith(".gifv")
          ? post.url_overridden_by_dest.replace(".gifv", ".gif")
          : post.url_overridden_by_dest;
      }
    }

    if (!imageUrl && post.preview?.images?.[0]?.source?.url) {
      imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, "&");
    }

    if (!imageUrl && post.media_metadata) {
      const mediaKeys = Object.keys(post.media_metadata);
      if (mediaKeys.length > 0) {
        const firstKey = mediaKeys[0];
        const mediaItem = post.media_metadata[firstKey];
        if (mediaItem.s && mediaItem.s.u) {
          imageUrl = mediaItem.s.u.replace(/&amp;/g, "&");
        }
      }
    }

    if (!imageUrl && post.thumbnail && post.thumbnail.startsWith("http")) {
      imageUrl = post.thumbnail;
    }

    if (
      !imageUrl &&
      post.url &&
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(post.url)
    ) {
      imageUrl = post.url;
    }

    return {
      title,
      content: truncateContent(content, 10000),
      source,
      author: `${author} in ${subreddit}`,
      imageUrl,
    };
  };

  try {
    console.log(`[Reddit] Fetching metadata from ${jsonUrl}`);

    // 1. Try Primary JSON (www.reddit.com)
    let response = await fetchWithTimeout(
      jsonUrl,
      { headers: { "User-Agent": BROWSER_UA } },
      5000,
    );

    if (response.ok) {
      return processJson(await response.json());
    }

    // 2. Try Secondary JSON (old.reddit.com)
    console.warn(
      `[Reddit] Primary fetch failed: ${response.status}. Trying old.reddit fallback.`,
    );
    const oldJsonUrl = jsonUrl.replace("www.reddit.com", "old.reddit.com");
    response = await fetchWithTimeout(
      oldJsonUrl,
      { headers: { "User-Agent": BROWSER_UA } },
      5000,
    );

    if (response.ok) {
      return processJson(await response.json());
    }

    // 3. Try Proxy JSON (r.nf)
    console.warn(`[Reddit] Old.reddit fetch failed. Trying r.nf proxy.`);
    const proxyJsonUrl = jsonUrl.replace("www.reddit.com", "r.nf");
    response = await fetchWithTimeout(
      proxyJsonUrl,
      { headers: { "User-Agent": BROWSER_UA } },
      8000,
    );

    if (response.ok) {
      return processJson(await response.json());
    }

    throw new Error(`All Reddit API attempts failed`);
  } catch (error) {
    console.error("Reddit API extraction failed:", error);

    // Fallback: HTML Scraping via old.reddit.com (Best for scraping)
    try {
      const oldHtmlUrl = cleanUrl.replace("www.reddit.com", "old.reddit.com");
      console.log(`[Reddit] Falling back to HTML scraping for ${oldHtmlUrl}`);

      const htmlResponse = await fetchWithTimeout(
        oldHtmlUrl,
        { headers: { "User-Agent": BROWSER_UA } },
        8000,
      );

      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        const JSDOM = await loadJSDOMSafe();

        if (JSDOM) {
          const virtualConsole = new (JSDOM as any).VirtualConsole();
          virtualConsole.on("error", () => {});

          const dom = new JSDOM(html, {
            url: oldHtmlUrl,
            virtualConsole,
            runScripts: undefined,
            resources: undefined,
          });
          const doc = dom.window.document;

          const title =
            doc.querySelector("a.title")?.textContent ||
            doc
              .querySelector('meta[property="og:title"]')
              ?.getAttribute("content") ||
            "Reddit Post";

          let image = doc
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content");

          if (!image) {
            const linkRow = doc.querySelector(".thing");
            if (linkRow) {
              const dataUrl = linkRow.getAttribute("data-url");
              if (
                dataUrl &&
                /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(dataUrl)
              ) {
                image = dataUrl;
              }
            }
          }

          const description = doc
            .querySelector('meta[property="og:description"]')
            ?.getAttribute("content");
          const author = 
            doc.querySelector("p.tagline .author")?.textContent ||
            "Reddit User";
          const subreddit = 
            doc.querySelector(".redditname a")?.textContent || "r/reddit";

          if (
            title &&
            title !== "Reddit - Dive into anything" &&
            !title.includes("Login") &&
            !title.includes("Log in")
          ) {
            console.log(`[Reddit] HTML Fallback success: ${title}`);
            return {
              title,
              content: description || title,
              source,
              imageUrl: image || undefined,
              author: `${author} in ${subreddit}`,
            };
          }
        }
      }
    } catch (fallbackError) {
      console.error("Reddit HTML fallback failed:", fallbackError);
    }

    throw new Error(
      "Could not extract Reddit content. The post may be private or deleted.",
    );
  }
}

/**
 * Extract video ID from TikTok URL
 * Supports: @username/video/123, vm.tiktok.com/ABC, vt.tiktok.com/XYZ
 */
function extractTikTokVideoId(url: string): string | undefined {
  // Pattern 1: Standard video URL with ID
  const standardMatch = url.match(/tiktok.com\/@[^\/]+\/video\/(\d+)/);
  if (standardMatch) return standardMatch[1];

  // Pattern 2: Short video URL
  const shortMatch = url.match(/v(?:m|t)\.tiktok.com\/([A-Za-z0-9]+)/);
  if (shortMatch) return shortMatch[1];

  return undefined;
}

/**
 * Extract username from TikTok URL
 */
function extractTikTokUsername(url: string): string | undefined {
  const match = url.match(/tiktok.com\/@([^\/]+)/);
  return match ? match[1] : undefined;
}

/**
 * Fetch tweet media (images/videos) using multiple fallback methods
 */
async function fetchTwitterMedia(
  url: string,
  tweetId?: string,
): Promise<{ imageUrl?: string; videoUrl?: string }> {
  const id = tweetId || extractTweetId(url);
  if (!id) return {};

  let imageUrl: string | undefined;
  let videoUrl: string | undefined;

  // Method 1: Try public syndication endpoints (no auth required)
  console.log(`[Twitter] Trying syndication API for tweet ${id}`);
  const syndicationEndpoints = [
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=a`,
    `https://cdn.syndication.twimg.com/tweet?id=${id}&lang=en`,
  ];

  for (const endpoint of syndicationEndpoints) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        { headers: { Accept: "application/json" } },
        8000,
      );

      if (!res.ok) {
        console.log(`[Twitter] Syndication ${res.status}:`, endpoint);
        continue;
      }

      const json = (await res.json()) as {
        photos?: Array<{ url?: string; expandedUrl?: string }>;
        video?: { poster?: string; variants?: Array<{ src?: string }> };
        mediaDetails?: Array<{ 
          media_url_https?: string;
          type?: string;
          video_info?: {
            variants?: Array<{ url?: string; content_type?: string }>;
          };
        }>;
      };

      // Extract image
      if (!imageUrl) {
        imageUrl =
          json.photos?.[0]?.url ||
          json.photos?.[0]?.expandedUrl ||
          json.video?.poster ||
          json.mediaDetails?.[0]?.media_url_https;
      }

      // Extract video
      if (!videoUrl && json.video?.variants) {
        // Find MP4 variant with highest bitrate
        const mp4Variant = json.video.variants.find((v) => v.src);
        videoUrl = mp4Variant?.src;
      }

      if (!videoUrl && json.mediaDetails) {
        const videoMedia = json.mediaDetails.find(
          (m) => m.type === "video" || m.video_info,
        );
        if (videoMedia?.video_info?.variants) {
          // Find MP4 variant
          const mp4 = videoMedia.video_info.variants.find(
            (v) => v.content_type === "video/mp4" && v.url,
          );
          videoUrl = mp4?.url;
        }
      }

      if (imageUrl || videoUrl) {
        console.log(
          `[Twitter] Syndication success: image=${!!imageUrl}, video=${!!videoUrl}`,
        );
        return { imageUrl, videoUrl };
      }
    } catch (err) {
      console.log("[Twitter] Syndication failed:", endpoint, err);
    }
  }

  // Method 2: Try Microlink API (reliable for metadata)
  try {
    console.log(`[Twitter] Trying Microlink API for tweet ${id}`);
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    const response = await fetchWithTimeout(
      microlinkUrl,
      { headers: { Accept: "application/json" } },
      8000,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        status: string;
        data?: {
          image?: { url?: string };
          video?: { url?: string };
        };
      };

      if (data.status === "success" && data.data) {
        imageUrl = imageUrl || data.data.image?.url;
        videoUrl = videoUrl || data.data.video?.url;

        if (imageUrl || videoUrl) {
          console.log(
            `[Twitter] Microlink success: image=${!!imageUrl}, video=${!!videoUrl}`,
          );
          return { imageUrl, videoUrl };
        }
      }
    }
  } catch (err) {
    console.log("[Twitter] Microlink failed:", err);
  }

  // Method 3: Try oEmbed thumbnail as last resort
  try {
    console.log(`[Twitter] Trying oEmbed thumbnail for tweet ${id}`);
    const canonical = (() => {
      const u = new URL(url);
      u.search = "";
      if (u.hostname.includes("x.com")) u.hostname = "twitter.com";
      return u.toString();
    })();

    const oembedRes = await fetchWithTimeout(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonical)}&omit_script=true`,
      { headers: { Accept: "application/json" } },
      6000,
    );

    if (oembedRes.ok) {
      const oembedJson = (await oembedRes.json()) as {
        thumbnail_url?: string;
      };
      if (oembedJson.thumbnail_url) {
        imageUrl = imageUrl || oembedJson.thumbnail_url;
        console.log("[Twitter] oEmbed thumbnail found");
        return { imageUrl };
      }
    }
  } catch (err) {
    console.log("[Twitter] oEmbed thumbnail failed:", err);
  }

  console.log(
    `[Twitter] All media fetch methods failed for tweet ${id}, returning empty`,
  );
  return { imageUrl, videoUrl };
}

/**
 * Fetch TikTok video metadata using oEmbed and Microlink APIs
 */
async function fetchTikTokMedia(
  url: string,
): Promise<{ imageUrl?: string; videoUrl?: string }> {
  let imageUrl: string | undefined;

  // Method 1: TikTok oEmbed API
  try {
    console.log(`[TikTok] Trying oEmbed API`);
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

    const response = await fetchWithTimeout(
      oembedUrl,
      { headers: { Accept: "application/json" } },
      6000,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        thumbnail_url?: string;
        thumbnail_width?: number;
        thumbnail_height?: number;
      };

      imageUrl = data.thumbnail_url;

      if (imageUrl) {
        console.log(`[TikTok] oEmbed success: thumbnail found`);
        return { imageUrl };
      }
    }
  } catch (err) {
    console.log("[TikTok] oEmbed failed:", err);
  }

  // Method 2: Microlink API fallback
  try {
    console.log(`[TikTok] Trying Microlink API`);
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    const response = await fetchWithTimeout(
      microlinkUrl,
      { headers: { Accept: "application/json" } },
      8000,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        status: string;
        data?: {
          image?: { url?: string };
          video?: { url?: string };
        };
      };

      if (data.status === "success" && data.data) {
        imageUrl = imageUrl || data.data.image?.url;

        if (imageUrl) {
          console.log(`[TikTok] Microlink success: image found`);
          return { imageUrl };
        }
      }
    }
  } catch (err) {
    console.log("[TikTok] Microlink failed:", err);
  }

  console.log(`[TikTok] All media fetch methods failed`);
  return { imageUrl };
}

async function resolveTikTokUrl(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(
      url,
      {
        redirect: "follow",
        headers: { Accept: "text/html" },
      },
      5000,
    );
    return res.url || url;
  } catch (err) {
    console.log("[TikTok] Failed to resolve redirect:", err);
    return url;
  }
}

/**
 * Extract content from Twitter/X using oEmbed and public endpoints
 */
async function extractTwitterContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;
  const tweetId = extractTweetId(url);

  // Normalize the URL for oEmbed compatibility
  const canonicalTweetUrl = (() => {
    const safe = new URL(url);
    safe.search = "";
    if (safe.hostname.includes("x.com")) {
      safe.hostname = "twitter.com";
    }
    return safe.toString();
  })();

  let tweetText = "";
  let authorName: string | undefined;

  try {
    console.log(`[Twitter] Extracting content from: ${url}`);

    // Step 1: Extract text and author from oEmbed
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonicalTweetUrl)}&omit_script=true`;
    const response = await fetchWithTimeout(
      oembedUrl,
      { headers: { Accept: "application/json" } },
      6000,
    );

    if (!response.ok) {
      throw new Error(
        `Twitter oEmbed API failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      author_name?: string;
      html?: string;
      thumbnail_url?: string;
    };

    // Extract plain text from the HTML payload without jsdom (avoid ESM issues in serverless)
    if (data.html) {
      tweetText = stripHtmlPreserveBreaks(data.html).trim();
    }

    authorName = data.author_name;

    // Validate that we got meaningful data
    if (!tweetText || tweetText.trim().length === 0) {
      throw new Error(
        "Twitter content extraction failed: No text content found",
      );
    }

    if (!authorName) {
      throw new Error(
        "Twitter content extraction failed: Unable to identify author",
      );
    }

    // Step 2: Fetch media (images/videos) using multiple fallback methods
    console.log(`[Twitter] Fetching media for tweet ${tweetId}`);
    const media = await fetchTwitterMedia(url, tweetId || undefined);

    console.log(
      `[Twitter] Extraction complete: author=${authorName}, content=${tweetText.length} chars, image=${!!media.imageUrl}, video=${!!media.videoUrl}`,
    );

    // Build response
    return {
      title: `Tweet by @${authorName}`,
      content: tweetText,
      source,
      author: authorName,
      imageUrl: media.imageUrl,
      videoUrl: media.videoUrl,
    };
  } catch (error) {
    console.error("Twitter extraction failed:", error);
    throw new Error(
      `Failed to extract Twitter content: ${error instanceof Error ? error.message : "Unknown error"}. The tweet may be private, deleted, or Twitter's API may be rate-limiting requests.`,
    );
  }
}

/**
 * Instagram oEmbed API response type
 */
interface InstagramOEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
}

/**
 * Microlink API response type
 */
interface MicrolinkResponse {
  status: string;
  data?: {
    title?: string;
    description?: string;
    author?: string;
    publisher?: string;
    image?: {
      url?: string;
      width?: number;
      height?: number;
    };
  };
}

/**
 * Extract Instagram content using multiple fallback methods:
 * 1. Instagram embed page (has consistent og tags)
 * 2. Noembed.com (free oEmbed proxy service)
 * 3. Direct page scraping
 * 4. Microlink API fallback
 */
async function extractInstagramContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;

  // Extract post ID and author from URL
  let urlAuthor: string | undefined;
  let postId: string | undefined;

  const postMatch = url.match(/instagram.com\/(?:p|reel)\/([^\/\?]+)/i);
  if (postMatch) {
    postId = postMatch[1];
  }

  const profileMatch = url.match(/instagram.com\/([^\/]+)\/(?:p|reel)\//i);
  if (profileMatch && profileMatch[1] !== "p" && profileMatch[1] !== "reel") {
    urlAuthor = profileMatch[1];
  }

  // Method 1: Try Instagram embed page (more consistent for og tags)
  if (postId) {
    try {
      console.log("Instagram extraction - trying embed page");

      // Instagram's embed endpoint returns a page with og:image
      const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;

      const response = await fetchWithTimeout(
        embedUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            Accept: "text/html,application/xhtml+xml",
          },
        },
        5000,
      );

      if (response.ok) {
        const html = await response.text();

        // Extract image/video URL from the embed HTML (reels often expose media here)
        let imageUrl: string | undefined;
        let videoUrl: string | undefined;
        let author: string | undefined;
        let caption: string | undefined;

        // Try to find video URL (mp4) in the embed payload
        const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+\.mp4[^"]*)"/i);
        if (videoMatch) {
          videoUrl = videoMatch[1].replace(/\\/g, "");
        }

        // Try to find image URL in the HTML (Instagram embed contains CDN URLs)
        const imgMatch = html.match(
          /src="(https:\/\/[^\"]*cdninstagram\.com[^\"]*\.(?:jpg|jpeg|png|webp)[^\"]*)"/i,
        );
        if (imgMatch) {
          imageUrl = imgMatch[1].replace(/&amp;/g, "&");
        }

        // Try to extract from background-image style
        if (!imageUrl) {
          const bgMatch = html.match(
            /background-image:\s*url\(['"]?(https:\/\/[^')\s]+cdninstagram\.com[^')\s]+)['"]?\)/i,
          );
          if (bgMatch) {
            imageUrl = bgMatch[1].replace(/&amp;/g, "&");
          }
        }

        // Extract author from embed
        const authorMatch = html.match(/@([a-zA-Z0-9_.]+)/);
        if (authorMatch) {
          author = authorMatch[1];
        }

        // Extract caption
        const captionMatch = html.match(
          /<div[^>]*class="[^ vital]*Caption[^ vital]*"[^>]*>([^<]+)</i,
        );
        if (captionMatch) {
          caption = captionMatch[1].trim();
        }

        author = author || urlAuthor;

        if (imageUrl || videoUrl) {
          console.log(
            `Instagram embed success: author=${author}, has image=${!!imageUrl}, has video=${!!videoUrl}`,
          );
          return {
            title: author ? `Instagram post by @${author}` : "Instagram Post",
            content: caption || "Instagram post content.",
            source,
            author,
            imageUrl,
            videoUrl,
            imageSource: "scrape",
          };
        }
      }
    } catch (error) {
      console.log("Instagram embed page failed:", error);
    }
  }

  // Method 2: Try noembed.com (free oEmbed proxy)
  try {
    console.log("Instagram extraction - trying noembed.com");

    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;

    const response = await fetchWithTimeout(
      noembedUrl,
      {
        headers: { Accept: "application/json" },
      },
      5000,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        author_name?: string;
        title?: string;
        thumbnail_url?: string;
        html?: string;
      };

      if (data.thumbnail_url) {
        const author = data.author_name || urlAuthor;
        console.log(
          `Instagram noembed success: author=${author}, has thumbnail=true`,
        );
        return {
          title: author ? `Instagram post by @${author}` : "Instagram Post",
          content: data.title || "Instagram post content.",
          source,
          author,
          imageUrl: data.thumbnail_url,
          imageSource: "oembed",
        };
      }
    }
  } catch (error) {
    console.log("Instagram noembed failed:", error);
  }

  // Method 3: Direct page scraping
  try {
    console.log("Instagram extraction - trying direct page scraping");

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
    });

    if (response.ok) {
      const html = await response.text();
      const JSDOM = await loadJSDOMSafe();
      if (!JSDOM) throw new Error("DOM parser unavailable");
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      const ogImage = document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");
      const ogVideo =
        document
          .querySelector('meta[property="og:video"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="og:video:secure_url"]')
          ?.getAttribute("content");
      const ogTitle = document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");
      const ogDesc = document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content");

      let author = urlAuthor;
      if (ogTitle) {
        const authorMatch = ogTitle.match(/^@?(\w+)\s+on\s+Instagram/i);
        if (authorMatch) {
          author = authorMatch[1];
        }
      }

      if (ogImage || ogVideo) {
        console.log(
          `Instagram scrape success: author=${author}, has image=${!!ogImage}, has video=${!!ogVideo}`,
        );
        return {
          title: author ? `Instagram post by @${author}` : "Instagram Post",
          content: ogDesc || "Instagram post content.",
          source,
          author,
          imageUrl: ogImage || undefined,
          videoUrl: ogVideo || undefined,
          imageSource: "scrape",
        };
      }
    }
  } catch (error) {
    console.log("Instagram direct scraping failed:", error);
  }

  // Method 4: Fallback to Microlink API
  try {
    console.log("Instagram extraction - falling back to Microlink API");

    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    const response = await fetchWithTimeout(
      microlinkUrl,
      {
        headers: { Accept: "application/json" },
      },
      8000,
    );

    if (response.ok) {
      throw new Error(`Microlink API failed: ${response.status}`);
    }

    const data = (await response.json()) as MicrolinkResponse;

    if (data.status !== "success" || !data.data) {
      throw new Error("Microlink returned no data");
    }

    const {
      title: rawTitle,
      description,
      author: rawAuthor,
      image,
    } = data.data;
    const video = (data.data as any).video;

    let author = rawAuthor?.replace(/^@/, "") || urlAuthor || undefined;

    if (!author && rawTitle) {
      const authorMatch = rawTitle.match(/\(@([^)]+)\)/);
      if (authorMatch) {
        author = authorMatch[1];
      }
    }

    const imageUrl = image?.url;
    const videoUrl: string | undefined = video?.url || undefined;

    console.log(
      `Instagram Microlink success: author=${author}, has image=${!!imageUrl}, has video=${!!videoUrl}`,
    );

    return {
      title: author ? `Instagram post by @${author}` : "Instagram Post",
      content: description || "Instagram post content.",
      source,
      author,
      imageUrl,
      videoUrl,
      imageSource: "microlink",
    };
  } catch (error) {
    console.error("Instagram Microlink extraction failed:", error);

    return {
      title: urlAuthor ? `Instagram post by @${urlAuthor}` : "Instagram Post",
      content:
        "Instagram content could not be extracted. Please view the original post.",
      source,
      author: urlAuthor,
    };
  }
}

/**
 * Extract LinkedIn URN from URL for embed support
 * Handles various LinkedIn URL formats:
 * - linkedin.com/posts/username_activity-7041158641097330688-xxxx
 * - linkedin.com/feed/update/urn:li:activity:7041158641097330688
 * - linkedin.com/feed/update/urn:li:share:7041158641097330688
 */
function extractLinkedInUrn(url: string): string | null {
  // Pattern 1: Direct URN in URL
  const urnMatch = url.match(/urn:li:(?:activity|share):(\d+)/);
  if (urnMatch) {
    return `urn:li:activity:${urnMatch[1]}`;
  }

  // Pattern 2: Activity ID in posts URL - Look for "activity-" followed by digits
  // Works for: linkedin.com/posts/username_slug-activity-1234567890-hash
  const postsMatch = url.match(/activity-(\d+)/i);
  if (postsMatch) {
    return `urn:li:activity:${postsMatch[1]}`;
  }

  // Pattern 3: Feed update URL with activity ID
  const feedMatch = url.match(/linkedin\.com\/feed\/update\/[^:]+:(\d+)/i);
  if (feedMatch) {
    return `urn:li:activity:${feedMatch[1]}`;
  }

  return null;
}

/**
 * Extract author username from LinkedIn URL
 */
function extractLinkedInAuthor(url: string): string | null {
  // Pattern: linkedin.com/posts/username_activity-...
  const postsMatch = url.match(/linkedin\.com\/posts\/([^\/_]+)/i);
  if (postsMatch) {
    return postsMatch[1];
  }

  // Pattern: linkedin.com/in/username/...
  const profileMatch = url.match(/linkedin\.com\/in\/([^\/]+)/i);
  if (profileMatch) {
    return profileMatch[1];
  }

  return null;
}

/**
 * Generate LinkedIn embed iframe code
 */
function generateLinkedInEmbedCode(urn: string): string {
  return `<iframe src="https://www.linkedin.com/embed/feed/update/${urn}" height="600" width="504" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>`;
}

/**
 * Check if LinkedIn returned a login wall instead of actual post content
 */
function isLinkedInLoginWall(title?: string, description?: string): boolean {
  if (!title) return false;

  const loginWallIndicators = [
    "sign up",
    "sign in",
    "log in",
    "join linkedin",
    "選擇語言", // "Select language" in Chinese
    "500 million+ members",
  ];

  const titleLower = title.toLowerCase();
  const descLower = (description || "").toLowerCase();

  // Check if it's a generic LinkedIn page (not a post)
  if (titleLower === "linkedin" || titleLower.startsWith("sign up")) {
    return true;
  }

  // Check for login wall indicators
  return loginWallIndicators.some(
    (indicator) =>
      titleLower.includes(indicator.toLowerCase()) ||
      descLower.includes(indicator.toLowerCase()),
  );
}

/**
 * Extract content from TikTok using oEmbed and public endpoints
 */
async function extractTikTokContent(url: string): Promise<ExtractedContent> {
  const resolvedUrl = await resolveTikTokUrl(url);
  const source = new URL(resolvedUrl).hostname;
  const videoId = extractTikTokVideoId(resolvedUrl);
  const urlUsername = extractTikTokUsername(resolvedUrl);

  let videoCaption = "";
  let authorName: string | undefined;
  let embedHtml: string | undefined;

  try {
    console.log(`[TikTok] Extracting content from: ${url}`);

    // Step 1: Extract text and author from oEmbed
    // Step 1: Try oEmbed first
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
      const response = await fetchWithTimeout(
        oembedUrl,
        { headers: { Accept: "application/json" } },
        6000,
      );

      if (response.ok) {
        const data = (await response.json()) as {
          title?: string;
          author_name?: string;
          author_url?: string;
          html?: string;
        };

        videoCaption = data.title || "";
        authorName = data.author_name;
        embedHtml = data.html; // Capture embed HTML for video playback

        if (!authorName && data.author_url) {
          const authorMatch = data.author_url.match(new RegExp("/@([^/\\?]+)"));
          if (authorMatch) authorName = authorMatch[1];
        }
      } else {
        console.log(`[TikTok] oEmbed failed with status ${response.status}`);
      }
    } catch (err) {
      console.log("[TikTok] oEmbed error:", err);
    }

    // Step 2: Microlink fallback if oEmbed gave us nothing
    if (!videoCaption || !authorName) {
      try {
        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(resolvedUrl)}`;
        const microlinkRes = await fetchWithTimeout(
          microlinkUrl,
          { headers: { Accept: "application/json" } },
          8000,
        );
        if (microlinkRes.ok) {
          const data = (await microlinkRes.json()) as {
            status?: string;
            data?: {
              title?: string;
              description?: string;
              author?: string;
            };
          };
          if (data.status === "success" && data.data) {
            videoCaption =
              videoCaption || data.data.title || data.data.description || "";
            authorName = authorName || data.data.author || urlUsername;
          }
        }
      } catch (err) {
        console.log("[TikTok] Microlink fallback failed:", err);
      }
    }

    // Fallback defaults if still missing
    videoCaption = videoCaption || "TikTok video";
    authorName = authorName || urlUsername || "unknown";

    // Step 3: Fetch media (thumbnail/video poster)
    console.log(`[TikTok] Fetching media for video ${videoId}`);
    const media = await fetchTikTokMedia(resolvedUrl);

    console.log(
      `[TikTok] Extraction complete: author=${authorName}, caption=${videoCaption.length} chars, image=${!!media.imageUrl}`,
    );

    // Build response
    return {
      title: `TikTok video by @${authorName}`,
      content: videoCaption,
      source,
      author: authorName,
      imageUrl: media.imageUrl,
      videoUrl: media.videoUrl,
      embedHtml,
    };
  } catch (error) {
    console.error("TikTok extraction failed:", error);
    throw new Error(
      `Failed to extract TikTok content: ${error instanceof Error ? error.message : "Unknown error"}. The video may be private, deleted, or TikTok's API may be rate-limiting requests.`,
    );
  }
}

/**
 * Extract content from LinkedIn using Microlink API
 * LinkedIn doesn't have a public oEmbed API, so we use Microlink for metadata extraction
 * Note: LinkedIn heavily restricts unauthenticated access, so we extract what we can
 */
async function extractLinkedInContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;

  // Extract URN for potential embed support
  const urn = extractLinkedInUrn(url);
  const urlAuthor = extractLinkedInAuthor(url);

  console.log(`LinkedIn extraction - URN: ${urn}, URL author: ${urlAuthor}`);

  // Try Microlink API first (most reliable for LinkedIn)
  try {
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    console.log("LinkedIn extraction - using Microlink API");

    const response = await fetchWithTimeout(
      microlinkUrl,
      {
        headers: {
          Accept: "application/json",
        },
      },
      8000,
    );

    if (!response.ok) {
      throw new Error(`Microlink API failed: ${response.status}`);
    }

    const data = (await response.json()) as MicrolinkResponse;

    if (data.status !== "success" || !data.data) {
      throw new Error("Microlink returned no data");
    }

    const {
      title: rawTitle,
      description,
      author: rawAuthor,
      publisher,
      image,
    } = data.data;

    // Check if LinkedIn returned a login wall instead of post content
    if (isLinkedInLoginWall(rawTitle, description)) {
      console.log("LinkedIn returned login wall, using URL-based extraction");
      throw new Error("LinkedIn login wall detected");
    }

    // Extract author - try multiple sources
    let author = rawAuthor || urlAuthor || undefined;

    // If title contains author info, try to extract it
    // LinkedIn title format: "Author Name on LinkedIn: Post text..."
    if (!author && rawTitle) {
      const authorMatch = rawTitle.match(/^([^|]+?)\s+(?:on\s+)?LinkedIn/i);
      if (authorMatch) {
        author = authorMatch[1].trim();
      }
    }

    // Clean up title - remove "on LinkedIn" suffix
    let title = rawTitle || "LinkedIn Post";
    if (author && title.toLowerCase().includes("linkedin")) {
      title = `LinkedIn post by ${author}`;
    }

    // Use description as content, clean it up
    let content = description || "";

    // LinkedIn descriptions often have "... See more" - we keep it as-is
    // The full content will be in the description when available
    if (!content || content.length < 20) {
      content =
        "LinkedIn post content. View the original post for full details.";
    }

    // Get image URL (LinkedIn og:images are usually good quality)
    const imageUrl = image?.url;

    console.log(
      `LinkedIn Microlink success: author=${author}, content length=${content.length}, has image=${!!imageUrl}, has URN=${!!urn}`,
    );

    return {
      title,
      content,
      source,
      author,
      imageUrl,
    };
  } catch (microlinkError) {
    console.log(
      "LinkedIn Microlink failed, trying direct fetch:",
      microlinkError,
    );
  }

  // Fallback: Try direct fetch with meta tags
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const JSDOM = await loadJSDOMSafe();
    if (!JSDOM) throw new Error("DOM parser unavailable");
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract from meta tags
    const ogTitle = document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content");
    const ogDesc = document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content");
    const ogImage = document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    const metaAuthor = document
      .querySelector('meta[name="author"]')
      ?.getAttribute("content");

    // Check for login wall
    if (isLinkedInLoginWall(ogTitle || undefined, ogDesc || undefined)) {
      console.log("LinkedIn direct fetch returned login wall");
      throw new Error("LinkedIn login wall detected");
    }

    // Determine author
    const author = metaAuthor || urlAuthor || undefined;

    // Build title
    let title = ogTitle || "LinkedIn Post";
    if (author && !title.includes(author)) {
      title = `LinkedIn post by ${author}`;
    }

    console.log(
      `LinkedIn direct fetch success: author=${author}, has description=${!!ogDesc}`,
    );

    return {
      title,
      content: ogDesc || "LinkedIn post content could not be extracted.",
      source,
      author,
      imageUrl: ogImage || undefined,
    };
  } catch (error) {
    console.error("LinkedIn extraction failed:", error);

    // Final fallback with URL-extracted info
    // This is the best we can do without authentication
    const author = urlAuthor || undefined;

    return {
      title: author ? `LinkedIn post by ${author}` : "LinkedIn Post",
      content: `This is a LinkedIn post${author ? ` by ${author}` : ""}. LinkedIn restricts access to post content without authentication. Click the link to view the original post.`,
      source,
      author,
    };
  }
}

/**
 * Generic content extraction using Readability
 */
async function extractGenericContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      10000,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();
    const JSDOM = await loadJSDOMSafe();

    if (JSDOM) {
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // Try to extract with Readability
      const reader = new Readability(document);
      const article = reader.parse();

      if (article && article.textContent && article.textContent.length > 100) {
        return {
          title: article.title || extractFallbackTitle(document, url),
          content: article.textContent,
          source,
        };
      }

      // Fallback: extract from meta tags or body text
      return {
        title: extractFallbackTitle(document, url),
        content: extractFallbackContent(document),
        source,
      };
    }

    // If JSDOM unavailable (Edge/ESM), fall back to stripped HTML
    return {
      title: extractFallbackTitle(null, url),
      content: stripHtmlPreserveBreaks(html),
      source,
    };
  } catch (error) {
    console.error("Generic extraction failed:", error);
    return {
      title: url,
      content: "",
      source,
    };
  }
}

function extractFallbackTitle(document: Document | null, url: string): string {
  const ogTitle = document
    ?.querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  const twitterTitle = document
    ?.querySelector('meta[name="twitter:title"]')
    ?.getAttribute("content");
  const titleTag = document?.querySelector("title")?.textContent;

  return ogTitle || twitterTitle || titleTag || url;
}

function extractFallbackContent(document: Document | null): string {
  const ogDesc = document
    ?.querySelector('meta[property="og:description"]')
    ?.getAttribute("content");
  const metaDesc = document
    ?.querySelector('meta[name="description"]')
    ?.getAttribute("content");

  if (ogDesc || metaDesc) {
    return ogDesc || metaDesc || "";
  }

  const body = document?.querySelector("body");
  if (body) {
    body
      .querySelectorAll("script, style, nav, footer, header")
      .forEach((el) => el.remove());
    return body.textContent?.slice(0, 5000) || "";
  }

  return "";
}

/**
 * Main extraction function - routes to platform-specific extractors
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  // Check if this is an email-sourced item (content already extracted by email processor)
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Email items use the sender domain as URL, but content is already in Item.rawContent
    // The pipeline will use rawContent for AI summarization, so we return minimal data here
    if (
      hostname === "email" ||
      hostname.includes("resend") ||
      hostname.includes("sendgrid") ||
      hostname.includes("mailgun")
    ) {
      console.log(`Email-sourced item detected: ${url}, skipping URL fetch`);
      return {
        title: "Email Newsletter",
        content: "",
        source: hostname,
      };
    }
  } catch {
    // Invalid URL, will be caught by platform detection below
  }

  const platform = detectPlatform(url);

  console.log(`Extracting content from ${platform}: ${url}`);

  switch (platform) {
    case "twitter":
      return extractTwitterContent(url);
    case "instagram":
      return extractInstagramContent(url);
    case "linkedin":
      return extractLinkedInContent(url);
    case "tiktok":
      return extractTikTokContent(url);
    case "youtube":
      return extractYoutubeContent(url);
    case "reddit":
      return extractRedditContent(url);
    default:
      return extractGenericContent(url);
  }
}

/**
 * Truncates content to a reasonable length for LLM processing
 */
export function truncateContent(content: string, maxLength = 4000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}
