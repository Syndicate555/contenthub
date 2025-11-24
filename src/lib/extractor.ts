import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ExtractedContent {
  title: string;
  content: string;
  source: string;
  author?: string;
  imageUrl?: string;
}

/**
 * Detects the platform from a URL
 */
function detectPlatform(url: string): "twitter" | "instagram" | "linkedin" | "generic" {
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
  return "generic";
}

/**
 * Extract tweet ID from Twitter/X URL
 */
function extractTweetId(url: string): string | null {
  // Patterns:
  // https://twitter.com/user/status/123456789
  // https://x.com/user/status/123456789
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract content from Twitter/X using oEmbed API
 */
async function extractTwitterContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;

  try {
    // Twitter oEmbed API - free, no auth required
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

    const response = await fetch(oembedUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Twitter oEmbed failed: ${response.status}`);
      throw new Error("Twitter oEmbed failed");
    }

    const data = await response.json() as {
      author_name?: string;
      author_url?: string;
      html?: string;
    };

    // Extract text from the HTML response
    // The HTML contains the tweet text in a blockquote
    let tweetText = "";
    let authorName = data.author_name || "Unknown";

    if (data.html) {
      // Parse the HTML to extract tweet text
      const dom = new JSDOM(data.html);
      const blockquote = dom.window.document.querySelector("blockquote");
      if (blockquote) {
        // Get all paragraph text (tweet content)
        const paragraphs = blockquote.querySelectorAll("p");
        tweetText = Array.from(paragraphs)
          .map(p => p.textContent?.trim())
          .filter(Boolean)
          .join("\n\n");
      }
    }

    // Create a descriptive title
    const title = `Tweet by @${authorName}`;

    return {
      title,
      content: tweetText || "Tweet content could not be extracted.",
      source,
      author: authorName,
    };
  } catch (error) {
    console.error("Twitter extraction failed:", error);

    // Return with indication that it's a Twitter post
    return {
      title: `Twitter Post`,
      content: "This is a Twitter/X post. The content could not be automatically extracted. Please view the original post.",
      source,
    };
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
 * Try Instagram's oEmbed API first (returns full thumbnail)
 * Falls back to Microlink if oEmbed fails
 */
async function extractInstagramContent(url: string): Promise<ExtractedContent> {
  const source = new URL(url).hostname;

  // First try Instagram oEmbed API (better quality thumbnails)
  try {
    console.log("Instagram extraction - trying oEmbed API first");

    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;

    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json() as InstagramOEmbedResponse;

      const author = oembedData.author_name || undefined;
      const title = author ? `Instagram post by @${author}` : "Instagram Post";

      // oEmbed title often contains the caption
      const content = oembedData.title || "Instagram post content.";

      // thumbnail_url from oEmbed is usually the full-size image
      const imageUrl = oembedData.thumbnail_url;

      console.log(`Instagram oEmbed success: author=${author}, has thumbnail=${!!imageUrl}`);

      if (imageUrl) {
        return {
          title,
          content,
          source,
          author,
          imageUrl,
        };
      }
    }
  } catch (error) {
    console.log("Instagram oEmbed failed, falling back to Microlink:", error);
  }

  // Fallback to Microlink API
  try {
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    console.log("Instagram extraction - falling back to Microlink API");

    const response = await fetch(microlinkUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microlink API failed: ${response.status}`);
    }

    const data = await response.json() as MicrolinkResponse;

    if (data.status !== "success" || !data.data) {
      throw new Error("Microlink returned no data");
    }

    const { title: rawTitle, description, author: rawAuthor, image } = data.data;

    // Extract clean author name (remove @ if present)
    let author = rawAuthor?.replace(/^@/, "") || undefined;

    // If no author from API, try to extract from title
    // Title format: "Username (@handle) • Instagram photo"
    if (!author && rawTitle) {
      const authorMatch = rawTitle.match(/\(@([^)]+)\)/);
      if (authorMatch) {
        author = authorMatch[1];
      }
    }

    // Build clean title
    const title = author
      ? `Instagram post by @${author}`
      : "Instagram Post";

    // Use description as content
    const content = description || "Instagram post content.";

    // Use og:image for Vision API analysis (even though it's cropped)
    // The pipeline will skip saving it to DB so it won't display
    const imageUrl = image?.url;

    console.log(`Instagram Microlink success: author=${author}, content length=${content.length}, has image=${!!image?.url}`);

    return {
      title,
      content,
      source,
      author,
      imageUrl,
    };
  } catch (error) {
    console.error("Instagram Microlink extraction failed:", error);

    // Fallback: extract what we can from URL
    let author: string | undefined;
    const urlMatch = url.match(/instagram\.com\/([^\/]+)\/(?:p|reel)\//i);
    if (urlMatch && urlMatch[1] !== "p" && urlMatch[1] !== "reel") {
      author = urlMatch[1];
    }

    return {
      title: author ? `Instagram post by @${author}` : "Instagram Post",
      content: "Instagram content could not be extracted. Please view the original post.",
      source,
      author,
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

  // Pattern 2: Activity ID in posts URL (linkedin.com/posts/username_activity-ID-hash)
  const postsMatch = url.match(/linkedin\.com\/posts\/[^\/]+_activity-(\d+)/i);
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
  const postsMatch = url.match(/linkedin\.com\/posts\/([^_\/]+)/i);
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
  return loginWallIndicators.some(indicator =>
    titleLower.includes(indicator.toLowerCase()) ||
    descLower.includes(indicator.toLowerCase())
  );
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

    const response = await fetch(microlinkUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microlink API failed: ${response.status}`);
    }

    const data = await response.json() as MicrolinkResponse;

    if (data.status !== "success" || !data.data) {
      throw new Error("Microlink returned no data");
    }

    const { title: rawTitle, description, author: rawAuthor, publisher, image } = data.data;

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
      content = "LinkedIn post content. View the original post for full details.";
    }

    // Get image URL (LinkedIn og:images are usually good quality)
    const imageUrl = image?.url;

    console.log(`LinkedIn Microlink success: author=${author}, content length=${content.length}, has image=${!!imageUrl}, has URN=${!!urn}`);

    return {
      title,
      content,
      source,
      author,
      imageUrl,
    };
  } catch (microlinkError) {
    console.log("LinkedIn Microlink failed, trying direct fetch:", microlinkError);
  }

  // Fallback: Try direct fetch with meta tags
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract from meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content");
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    const metaAuthor = document.querySelector('meta[name="author"]')?.getAttribute("content");

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

    console.log(`LinkedIn direct fetch success: author=${author}, has description=${!!ogDesc}`);

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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
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

    // Fallback: extract from meta tags
    return {
      title: extractFallbackTitle(document, url),
      content: extractFallbackContent(document),
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

function extractFallbackTitle(document: Document, url: string): string {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute("content");
  const titleTag = document.querySelector("title")?.textContent;

  return ogTitle || twitterTitle || titleTag || url;
}

function extractFallbackContent(document: Document): string {
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content");
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");

  if (ogDesc || metaDesc) {
    return ogDesc || metaDesc || "";
  }

  const body = document.querySelector("body");
  if (body) {
    body.querySelectorAll("script, style, nav, footer, header").forEach((el) => el.remove());
    return body.textContent?.slice(0, 5000) || "";
  }

  return "";
}

/**
 * Main extraction function - routes to platform-specific extractors
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  const platform = detectPlatform(url);

  console.log(`Extracting content from ${platform}: ${url}`);

  switch (platform) {
    case "twitter":
      return extractTwitterContent(url);
    case "instagram":
      return extractInstagramContent(url);
    case "linkedin":
      return extractLinkedInContent(url);
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
