import { useState, useEffect } from "react";
import { saveItem } from "../../shared/api";
import { clearAllData } from "../../shared/storage";
import type { Badge } from "../../shared/types";

interface SaveScreenProps {
  token: string;
  onSaveSuccess: (badges?: Badge[]) => void;
  onLogout: () => void;
}

export default function SaveScreen({
  token,
  onSaveSuccess,
  onLogout,
}: SaveScreenProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState("");

  // Get current tab URL on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0] && tabs[0].id) {
        try {
          // Execute script to get the actual current URL (fixes SPA routing issues)
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              // Get URL from multiple sources for better SPA support
              let url = window.location.href;
              let title = document.title;

              // For Twitter/X: Check canonical URL meta tag
              // Twitter sets this even when viewing tweets in modals
              const canonicalLink = document.querySelector(
                'link[rel="canonical"]',
              ) as HTMLLinkElement;
              if (canonicalLink && canonicalLink.href) {
                // Use canonical URL if it's more specific than current URL
                // e.g., canonical might be tweet URL while location.href is still /home
                if (
                  url.includes("/home") &&
                  canonicalLink.href.includes("/status/")
                ) {
                  url = canonicalLink.href;
                }
              }

              // For Twitter/X: Try to get URL from og:url meta tag as fallback
              const ogUrl = document.querySelector(
                'meta[property="og:url"]',
              ) as HTMLMetaElement;
              if (ogUrl && ogUrl.content && url.includes("/home")) {
                if (ogUrl.content.includes("/status/")) {
                  url = ogUrl.content;
                }
              }

              // For LinkedIn: Extract post URL from DOM
              // LinkedIn posts in feed don't update URL, need to extract from page structure
              if (url.includes("linkedin.com")) {
                let postUrl = null;

                // Method 1: Check canonical URL
                if (canonicalLink && canonicalLink.href) {
                  if (
                    canonicalLink.href.includes("/posts/") ||
                    canonicalLink.href.includes("/feed/update/")
                  ) {
                    console.log(
                      "[Tavlo Extension] Found LinkedIn post URL in canonical:",
                      canonicalLink.href,
                    );
                    postUrl = canonicalLink.href;
                  }
                }

                // Method 2: Check og:url
                if (
                  !postUrl &&
                  ogUrl &&
                  ogUrl.content &&
                  (ogUrl.content.includes("/posts/") ||
                    ogUrl.content.includes("/feed/update/"))
                ) {
                  console.log(
                    "[Tavlo Extension] Found LinkedIn post URL in og:url:",
                    ogUrl.content,
                  );
                  postUrl = ogUrl.content;
                }

                // Method 3: Extract from DOM - look for post permalink in share menu or modal
                if (!postUrl) {
                  console.log(
                    "[Tavlo Extension] Extracting LinkedIn post URL from DOM...",
                  );

                  // Look for the currently open post modal/overlay
                  const postModal = document.querySelector(
                    '[role="dialog"][aria-labelledby], .scaffold-layout__detail',
                  );

                  if (postModal) {
                    // Strategy A: Find permalink in "Copy link" button or share options
                    const copyLinkButton = postModal.querySelector(
                      '[aria-label*="Copy link"], [data-test-id="share-via-copy-link"]',
                    );

                    if (copyLinkButton) {
                      // Try to extract URL from data attributes or nearby elements
                      const dataUrl = copyLinkButton.getAttribute("data-url");
                      if (dataUrl && dataUrl.includes("/posts/")) {
                        postUrl = dataUrl;
                        console.log(
                          "[Tavlo Extension] Found post URL in copy link button data:",
                          postUrl,
                        );
                      }
                    }

                    // Strategy B: Find URN in data attributes and construct URL
                    if (!postUrl) {
                      const urnElements = postModal.querySelectorAll(
                        "[data-urn], [data-activity-urn]",
                      );

                      for (const el of urnElements) {
                        const urn =
                          el.getAttribute("data-urn") ||
                          el.getAttribute("data-activity-urn");

                        if (urn && urn.includes("activity:")) {
                          // Extract activity ID from URN like "urn:li:activity:1234567890"
                          const activityMatch = urn.match(/activity:(\d+)/);
                          if (activityMatch) {
                            const activityId = activityMatch[1];
                            postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`;
                            console.log(
                              "[Tavlo Extension] Constructed post URL from URN:",
                              postUrl,
                            );
                            break;
                          }
                        }

                        if (urn && urn.includes("ugcPost:")) {
                          // Extract ugcPost ID from URN
                          const ugcMatch = urn.match(/ugcPost:(\d+)/);
                          if (ugcMatch) {
                            const ugcId = ugcMatch[1];
                            postUrl = `https://www.linkedin.com/feed/update/urn:li:ugcPost:${ugcId}`;
                            console.log(
                              "[Tavlo Extension] Constructed post URL from ugcPost URN:",
                              postUrl,
                            );
                            break;
                          }
                        }
                      }
                    }

                    // Strategy C: Look for share button with URL
                    if (!postUrl) {
                      const shareButtons = postModal.querySelectorAll(
                        'button[aria-label*="Share"], button[data-test-id*="share"]',
                      );

                      for (const button of shareButtons) {
                        // Click share button reveals URL - look in nearby elements
                        const parent = button.closest("div");
                        if (parent) {
                          const links = parent.querySelectorAll("a[href]");
                          for (const link of links) {
                            const href = (link as HTMLAnchorElement).href;
                            if (
                              href &&
                              (href.includes("/posts/") ||
                                href.includes("/feed/update/"))
                            ) {
                              postUrl = href;
                              console.log(
                                "[Tavlo Extension] Found post URL near share button:",
                                postUrl,
                              );
                              break;
                            }
                          }
                        }
                        if (postUrl) break;
                      }
                    }

                    // Strategy D: Look for author profile + post slug in URL structure
                    if (!postUrl) {
                      const postLinks =
                        postModal.querySelectorAll('a[href*="/posts/"]');
                      for (const link of postLinks) {
                        const href = (link as HTMLAnchorElement).href;
                        // Match pattern: /posts/username_activity-1234567890-hash
                        if (href.match(/\/posts\/[^\/]+_activity-\d+/)) {
                          postUrl = href;
                          console.log(
                            "[Tavlo Extension] Found post URL in post link:",
                            postUrl,
                          );
                          break;
                        }
                      }
                    }
                  }

                  // Fallback: Search entire page if modal not found
                  if (!postUrl) {
                    console.log(
                      "[Tavlo Extension] Modal not found, searching entire page...",
                    );

                    // Look for focused/highlighted post in feed
                    const focusedPost = document.querySelector(
                      '.feed-shared-update-v2--focused, [data-test-id="main-feed-activity-card"]',
                    );

                    if (focusedPost) {
                      const urn =
                        focusedPost.getAttribute("data-urn") ||
                        focusedPost.getAttribute("data-activity-urn");

                      if (urn && urn.includes("activity:")) {
                        const activityMatch = urn.match(/activity:(\d+)/);
                        if (activityMatch) {
                          postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${activityMatch[1]}`;
                          console.log(
                            "[Tavlo Extension] Constructed URL from focused post URN:",
                            postUrl,
                          );
                        }
                      }
                    }
                  }
                }

                if (postUrl) {
                  console.log(
                    "[Tavlo Extension] Successfully extracted LinkedIn post URL:",
                    postUrl,
                  );
                  url = postUrl;
                } else {
                  console.log(
                    "[Tavlo Extension] Could not extract LinkedIn post URL, using page URL",
                  );
                  // Keep the original URL (linkedin.com/feed)
                  // We'll show a helpful message in the UI
                }
              }

              // For TikTok: Extract video URL from DOM
              // TikTok videos in feed don't update URL, need to extract from page structure
              if (url.includes("tiktok.com")) {
                let videoUrl = null;

                // Method 1: Check canonical URL first
                if (canonicalLink && canonicalLink.href) {
                  if (
                    canonicalLink.href.includes("/video/") ||
                    (canonicalLink.href.includes("/@") &&
                      canonicalLink.href !== url)
                  ) {
                    console.log(
                      "[Tavlo Extension] Found video URL in canonical:",
                      canonicalLink.href,
                    );
                    videoUrl = canonicalLink.href;
                  }
                }

                // Method 2: Check og:url
                if (
                  !videoUrl &&
                  ogUrl &&
                  ogUrl.content &&
                  (ogUrl.content.includes("/video/") ||
                    (ogUrl.content.includes("/@") && ogUrl.content !== url))
                ) {
                  console.log(
                    "[Tavlo Extension] Found video URL in og:url:",
                    ogUrl.content,
                  );
                  videoUrl = ogUrl.content;
                }

                // Method 3: Extract from DOM - look for share button or link with video URL
                if (!videoUrl) {
                  console.log(
                    "[Tavlo Extension] Extracting video URL from DOM...",
                  );

                  // Try to find the currently playing video container
                  const videoContainer = document.querySelector(
                    '[data-e2e="browse-video"]',
                  );

                  if (videoContainer) {
                    // Look for link elements within the video container
                    const links = videoContainer.querySelectorAll("a");
                    for (const link of links) {
                      if (
                        link.href &&
                        link.href.includes("/@") &&
                        link.href.includes("/video/")
                      ) {
                        console.log(
                          "[Tavlo Extension] Found video URL in DOM link:",
                          link.href,
                        );
                        videoUrl = link.href;
                        break;
                      }
                    }
                  }
                }

                // Method 4: Look for video link in share buttons or metadata
                if (!videoUrl) {
                  // Check for share button URL
                  const shareButtons = document.querySelectorAll(
                    '[data-e2e="share-button"], [aria-label*="Share"], [aria-label*="share"]',
                  );

                  for (const button of shareButtons) {
                    const parent = button.closest("div[data-e2e]");
                    if (parent) {
                      const links = parent.querySelectorAll("a");
                      for (const link of links) {
                        if (
                          link.href &&
                          link.href.includes("/@") &&
                          link.href.includes("/video/")
                        ) {
                          console.log(
                            "[Tavlo Extension] Found video URL near share button:",
                            link.href,
                          );
                          videoUrl = link.href;
                          break;
                        }
                      }
                    }
                    if (videoUrl) break;
                  }
                }

                // Method 5: Search ALL links on page (broader search)
                if (!videoUrl) {
                  const allLinks = document.querySelectorAll("a");
                  console.log(
                    `[Tavlo Extension] Searching ${allLinks.length} total links...`,
                  );

                  const videoLinks: HTMLAnchorElement[] = [];

                  // Collect all links that look like video URLs
                  for (const link of allLinks) {
                    const href = link.getAttribute("href") || link.href;
                    if (
                      href &&
                      (href.includes("/video/") ||
                        (href.includes("/@") && href.includes("/video")))
                    ) {
                      videoLinks.push(link as HTMLAnchorElement);
                    }
                  }

                  console.log(
                    `[Tavlo Extension] Found ${videoLinks.length} potential video links`,
                  );

                  // Find the first visible video link
                  for (const link of videoLinks) {
                    const href = link.getAttribute("href") || link.href;
                    const rect = link.getBoundingClientRect();
                    if (
                      rect.width > 0 &&
                      rect.height > 0 &&
                      rect.top >= 0 &&
                      rect.top <= window.innerHeight
                    ) {
                      console.log(
                        "[Tavlo Extension] Found visible video URL:",
                        href,
                      );
                      videoUrl = href.startsWith("http")
                        ? href
                        : `https://www.tiktok.com${href}`;
                      break;
                    }
                  }

                  // If no visible link, take the first one
                  if (!videoUrl && videoLinks.length > 0) {
                    const href =
                      videoLinks[0].getAttribute("href") || videoLinks[0].href;
                    console.log(
                      "[Tavlo Extension] Using first video URL found:",
                      href,
                    );
                    videoUrl = href.startsWith("http")
                      ? href
                      : `https://www.tiktok.com${href}`;
                  }
                }

                // Method 6: Extract from page data/attributes - FIND ACTIVE VIDEO
                if (!videoUrl) {
                  console.log(
                    "[Tavlo Extension] Attempting to extract from page data...",
                  );

                  // CRITICAL: Find the currently VISIBLE/PLAYING video container
                  // TikTok loads multiple videos, we need the one in viewport
                  let activeVideoContainer: Element | null = null;

                  // Try to find active video container (the one currently in view)
                  const videoContainers = document.querySelectorAll(
                    '[data-e2e="recommend-list-item-container"]',
                  );
                  console.log(
                    `[Tavlo Extension] Found ${videoContainers.length} video containers`,
                  );

                  // Find the container that's most visible in viewport
                  let maxVisibility = 0;
                  for (const container of videoContainers) {
                    const rect = container.getBoundingClientRect();
                    const visibleHeight =
                      Math.min(rect.bottom, window.innerHeight) -
                      Math.max(rect.top, 0);
                    const visibility = visibleHeight / window.innerHeight;

                    if (visibility > maxVisibility) {
                      maxVisibility = visibility;
                      activeVideoContainer = container;
                    }
                  }

                  if (activeVideoContainer) {
                    console.log(
                      "[Tavlo Extension] Found active video container with",
                      Math.round(maxVisibility * 100),
                      "% visibility",
                    );
                  } else {
                    console.log(
                      "[Tavlo Extension] No video container found, searching entire page",
                    );
                  }

                  // Search within the active container (or entire page if not found)
                  const searchContext = activeVideoContainer || document;

                  // Look for video ID in the page - try multiple approaches
                  let videoId = null;
                  let username = null;

                  // Get username from user profile link WITHIN active video
                  const userLinks =
                    searchContext.querySelectorAll('a[href^="/@"]');
                  console.log(
                    `[Tavlo Extension] Found ${userLinks.length} user profile links in active video`,
                  );

                  if (userLinks.length > 0) {
                    const userHref = (
                      userLinks[0] as HTMLAnchorElement
                    ).getAttribute("href");
                    if (userHref && userHref.startsWith("/@")) {
                      username = userHref; // e.g., "/@theaisurfer"
                      console.log(
                        "[Tavlo Extension] Extracted username from active video:",
                        username,
                      );
                    }
                  }

                  // Try to find video ID from various sources WITHIN active video
                  // 1. Check for data attributes in active video container
                  const elementsWithData = searchContext.querySelectorAll(
                    "[data-video-id], [data-item-id], [data-id]",
                  );
                  console.log(
                    `[Tavlo Extension] Found ${elementsWithData.length} elements with data attributes in active video`,
                  );

                  for (const el of elementsWithData) {
                    const id =
                      el.getAttribute("data-video-id") ||
                      el.getAttribute("data-item-id") ||
                      el.getAttribute("data-id");
                    if (id && id.length > 10) {
                      // Video IDs are long numbers
                      videoId = id;
                      console.log(
                        "[Tavlo Extension] Found video ID in data attribute:",
                        videoId,
                      );
                      break;
                    }
                  }

                  // 2. Check window.__NEXT_DATA__ or similar TikTok state
                  if (!videoId && typeof window !== "undefined") {
                    try {
                      const nextData = (window as any).__NEXT_DATA__;
                      if (nextData) {
                        console.log(
                          "[Tavlo Extension] Found __NEXT_DATA__, searching for video ID...",
                        );
                        const dataStr = JSON.stringify(nextData);
                        // Look for long number that might be video ID
                        const match = dataStr.match(/"itemId":"(\d{15,})"/);
                        if (match) {
                          videoId = match[1];
                          console.log(
                            "[Tavlo Extension] Extracted video ID from __NEXT_DATA__:",
                            videoId,
                          );
                        }
                      }
                    } catch (e) {
                      console.log(
                        "[Tavlo Extension] Error reading __NEXT_DATA__:",
                        e,
                      );
                    }
                  }

                  // 3. Search for video ID in active container HTML (as last resort)
                  if (!videoId && activeVideoContainer) {
                    console.log(
                      "[Tavlo Extension] Searching active video HTML for video ID pattern...",
                    );
                    const containerText = activeVideoContainer.innerHTML;
                    // Look for TikTok video ID pattern (long numbers, typically 19 digits)
                    const matches = containerText.match(/\b\d{16,20}\b/g);
                    if (matches && matches.length > 0) {
                      // Take the first long number we find in active container
                      videoId = matches[0];
                      console.log(
                        "[Tavlo Extension] Found potential video ID in active video HTML:",
                        videoId,
                      );
                    }
                  }

                  // Construct URL if we have both username and video ID
                  if (username && videoId) {
                    videoUrl = `https://www.tiktok.com${username}/video/${videoId}`;
                    console.log(
                      "[Tavlo Extension] Constructed video URL:",
                      videoUrl,
                    );
                  } else {
                    console.log(
                      "[Tavlo Extension] Missing data - username:",
                      username,
                      "videoId:",
                      videoId,
                    );
                  }
                }

                if (videoUrl) {
                  console.log(
                    "[Tavlo Extension] Successfully extracted video URL:",
                    videoUrl,
                  );
                  url = videoUrl;
                } else {
                  console.log(
                    "[Tavlo Extension] Could not extract video URL, using page URL",
                  );
                }
              }

              return {
                url,
                title,
              };
            },
          });

          if (results && results[0] && results[0].result) {
            setCurrentUrl(results[0].result.url);
            setCurrentTitle(results[0].result.title);
          } else {
            // Fallback to tab URL
            setCurrentUrl(tabs[0].url || "");
            setCurrentTitle(tabs[0].title || "");
          }
        } catch (error) {
          console.error("Error getting URL:", error);
          // Fallback to tab URL
          setCurrentUrl(tabs[0].url || "");
          setCurrentTitle(tabs[0].title || "");
        }
      }
    });
  }, []);

  const handleUrlEdit = () => {
    setEditedUrl(currentUrl);
    setIsEditingUrl(true);
  };

  const handleUrlSave = () => {
    // Validate URL
    try {
      new URL(editedUrl);
      setCurrentUrl(editedUrl);
      setIsEditingUrl(false);
      setError(null);
    } catch {
      setError("Invalid URL format. Please enter a valid URL.");
    }
  };

  const handleUrlCancel = () => {
    setEditedUrl("");
    setIsEditingUrl(false);
    setError(null);
  };

  const handleSave = async () => {
    const urlToSave = isEditingUrl ? editedUrl : currentUrl;

    if (!urlToSave) {
      setError("No URL to save");
      return;
    }

    // Validate URL before saving
    try {
      new URL(urlToSave);
    } catch {
      setError("Invalid URL format. Please enter a valid URL.");
      return;
    }

    setError(null);
    setIsSaving(true);

    // Fire-and-forget with smart validation
    // We'll wait up to 2 seconds for validation errors, then show success
    const VALIDATION_TIMEOUT = 2000; // 2 seconds

    try {
      // Create a promise that resolves after validation timeout
      const timeoutPromise = new Promise<{ optimistic: boolean }>((resolve) => {
        setTimeout(() => resolve({ optimistic: true }), VALIDATION_TIMEOUT);
      });

      // Create the save request promise
      const savePromise = saveItem(urlToSave, note || undefined, token).then(
        (result) => {
          if (result.success) {
            return { optimistic: false, success: true, result };
          } else {
            // Validation error - throw to catch block
            throw new Error(result.error || "Failed to save item");
          }
        },
      );

      // Race between timeout and save request
      const response = await Promise.race([timeoutPromise, savePromise]);

      if (response.optimistic) {
        // Timeout completed first - show success optimistically
        // The request continues in background
        console.log(
          "Showing optimistic success, request continues in background",
        );
        onSaveSuccess(); // No badges yet in optimistic mode

        // Continue waiting for actual response in background
        savePromise
          .then(() => {
            console.log("Background save completed successfully");
          })
          .catch((error) => {
            // If it fails after showing success, log it
            // In a real app, you might want to show a toast notification
            console.error("Background save failed:", error);
          });
      } else {
        // Save completed before timeout - show actual success
        console.log("Save completed quickly, showing real success");
        // Extract badges from result
        const badges =
          "result" in response && response.result?.badges
            ? response.result.badges
            : undefined;
        onSaveSuccess(badges);
      }
    } catch (error) {
      // This catches validation errors (auth, rate limit, invalid URL, etc.)
      console.error("Save error:", error);
      setIsSaving(false);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save. Please try again.",
      );
    }
  };

  const handleLogout = async () => {
    await clearAllData();
    onLogout();
  };

  // Detect platform from URL
  const getPlatform = (url: string) => {
    if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
    if (url.includes("reddit.com")) return "Reddit";
    if (url.includes("youtube.com")) return "YouTube";
    if (url.includes("instagram.com")) return "Instagram";
    if (url.includes("linkedin.com")) {
      // More specific platform detection for LinkedIn
      if (url.includes("/feed") && !url.includes("/feed/update/")) {
        return "LinkedIn Feed";
      }
      return "LinkedIn";
    }
    if (url.includes("tiktok.com")) return "TikTok";
    return "Web";
  };

  const isGenericFeedUrl = (url: string) => {
    // Detect if URL is a generic feed page (not a specific post)
    if (url.includes("linkedin.com/feed") && !url.includes("/feed/update/")) {
      return true;
    }
    if (url.includes("twitter.com/home") || url.includes("x.com/home")) {
      return true;
    }
    if (url === "https://www.tiktok.com/" || url === "https://tiktok.com/") {
      return true;
    }
    return false;
  };

  const displayUrl = isEditingUrl ? editedUrl : currentUrl;
  const platform = getPlatform(displayUrl);
  const showFeedWarning = isGenericFeedUrl(displayUrl);

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-purple-200 transform hover:scale-105 transition-transform duration-200">
            T
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Save to Tavlo
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105 font-medium px-3 py-1.5 rounded-full hover:bg-red-50"
        >
          Logout
        </button>
      </div>

      {/* Current URL */}
      <div className="mb-5 animate-[fadeIn_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            URL to Save
          </label>
          {!isEditingUrl && (
            <button
              onClick={handleUrlEdit}
              className="text-xs text-purple-600 hover:text-purple-700 transition-all duration-200 font-semibold hover:scale-105 px-2 py-1 rounded-lg hover:bg-purple-50"
            >
              Edit URL
            </button>
          )}
        </div>

        {isEditingUrl ? (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            <input
              type="text"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              onFocus={(e) => e.target.select()} // Auto-select all text on focus
              placeholder="https://example.com/page"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-3 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleUrlSave}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all duration-200 hover:scale-105"
              >
                Save URL
              </button>
              <button
                onClick={handleUrlCancel}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm ${
                  showFeedWarning
                    ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700"
                    : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700"
                }`}
              >
                {platform}
              </span>
              {currentTitle && (
                <span className="text-sm text-gray-700 truncate flex-1 font-medium">
                  {currentTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate font-mono">
              {displayUrl}
            </p>
          </div>
        )}

        {/* Generic feed URL warning */}
        {showFeedWarning && !isEditingUrl && (
          <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl animate-[fadeIn_0.3s_ease-out] shadow-sm">
            <p className="text-yellow-800 text-xs flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">
                <strong className="font-semibold">
                  Generic feed URL detected.
                </strong>{" "}
                This will save the feed page, not a specific post. Click{" "}
                <button
                  onClick={handleUrlEdit}
                  className="text-yellow-900 underline font-semibold hover:text-yellow-700 transition-colors duration-200"
                >
                  Edit URL
                </button>{" "}
                to paste the correct post link.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Note Input */}
      <div className="mb-5 animate-[fadeIn_0.5s_ease-out]">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Add a Note (Optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why are you saving this? Add context..."
          maxLength={500}
          className="w-full h-28 px-4 py-3 border-2 border-gray-100 rounded-2xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">
          {note.length}/500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl animate-[shake_0.5s_ease-in-out] shadow-sm">
          <p className="text-red-600 text-sm flex items-center gap-2 font-medium">
            <span className="text-lg">⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !currentUrl}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base hover:scale-105 transform animate-[fadeIn_0.6s_ease-out]"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            Validating...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Save to Tavlo
            <span className="text-lg">✨</span>
          </span>
        )}
      </button>

      {/* Footer */}
      <p className="text-xs text-gray-500 text-center mt-5 font-medium animate-[fadeIn_0.7s_ease-out]">
        This will be saved to your Tavlo library
      </p>
    </div>
  );
}
