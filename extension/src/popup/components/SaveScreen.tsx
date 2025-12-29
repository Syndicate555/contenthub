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

  // Get current tab URL on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0] && tabs[0].id) {
        try {
          // Execute script to get the actual current URL (fixes SPA routing issues)
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              return {
                url: window.location.href,
                title: document.title,
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

  const handleSave = async () => {
    if (!currentUrl) {
      setError("No URL to save");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const result = await saveItem(currentUrl, note || undefined, token);

      if (result.success) {
        // TODO: Store result for success screen
        onSaveSuccess();
      } else {
        setError(result.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
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

  const platform = getPlatform(currentUrl);

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
        <label className="block text-sm font-medium text-text-primary mb-2">
          Current Page
        </label>
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
          <p className="text-xs text-text-secondary truncate">{currentUrl}</p>
        </div>
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
            Saving...
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
