import React, { useState, useEffect } from "react";
import { saveItem } from "../../shared/api";
import { clearAllData } from "../../shared/storage";

interface SaveScreenProps {
  token: string;
  onSaveSuccess: () => void;
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
                'link[rel="canonical"]'
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
                'meta[property="og:url"]'
              ) as HTMLMetaElement;
              if (ogUrl && ogUrl.content && url.includes("/home")) {
                if (ogUrl.content.includes("/status/")) {
                  url = ogUrl.content;
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
        }
      );

      // Race between timeout and save request
      const response = await Promise.race([timeoutPromise, savePromise]);

      if (response.optimistic) {
        // Timeout completed first - show success optimistically
        // The request continues in background
        console.log("Showing optimistic success, request continues in background");
        onSaveSuccess();

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
        onSaveSuccess();
      }
    } catch (error) {
      // This catches validation errors (auth, rate limit, invalid URL, etc.)
      console.error("Save error:", error);
      setIsSaving(false);
      setError(
        error instanceof Error ? error.message : "Failed to save. Please try again."
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
    if (url.includes("linkedin.com")) return "LinkedIn";
    if (url.includes("tiktok.com")) return "TikTok";
    return "Web";
  };

  const displayUrl = isEditingUrl ? editedUrl : currentUrl;
  const platform = getPlatform(displayUrl);

  return (
    <div className="w-full h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-1 to-brand-2 flex items-center justify-center text-white text-sm font-bold">
            T
          </div>
          <h1 className="text-lg font-bold text-text-primary">Save to Tavlo</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-text-secondary hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Current URL */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-primary">
            URL to Save
          </label>
          {!isEditingUrl && (
            <button
              onClick={handleUrlEdit}
              className="text-xs text-brand-1 hover:text-brand-2 transition-colors font-medium"
            >
              Edit URL
            </button>
          )}
        </div>

        {isEditingUrl ? (
          <div>
            <input
              type="text"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleUrlSave}
                className="flex-1 px-3 py-2 bg-brand-1 text-white rounded-lg text-xs font-medium hover:bg-brand-2 transition-colors"
              >
                Save URL
              </button>
              <button
                onClick={handleUrlCancel}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                {platform}
              </span>
              {currentTitle && (
                <span className="text-sm text-text-primary truncate flex-1">
                  {currentTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary truncate">{displayUrl}</p>
          </div>
        )}
      </div>

      {/* Note Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-2">
          Add a Note (Optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why are you saving this? Add context..."
          maxLength={500}
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent"
        />
        <p className="text-xs text-text-secondary mt-1">
          {note.length}/500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !currentUrl}
        className="w-full px-4 py-3 bg-gradient-to-r from-brand-1 to-brand-2 text-white rounded-lg hover:shadow-lg hover:shadow-brand-1/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Validating...
          </span>
        ) : (
          "Save to Tavlo"
        )}
      </button>

      {/* Footer */}
      <p className="text-xs text-text-secondary text-center mt-4">
        This will be saved to your Tavlo library
      </p>
    </div>
  );
}
