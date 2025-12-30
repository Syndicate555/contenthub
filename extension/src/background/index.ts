// Background service worker for Tavlo extension
// Handles context menu and Chrome extension events

import { saveItem } from "../shared/api";
import { getToken, setToken, setUserEmail } from "../shared/storage";

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for saving links
  chrome.contextMenus.create({
    id: "save-to-tavlo",
    title: "Save to Tavlo",
    contexts: ["link", "page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-tavlo") {
    const url = info.linkUrl || info.pageUrl || tab?.url;

    if (!url) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
        title: "Tavlo - Error",
        message: "No URL found to save",
      });
      return;
    }

    // Get auth token
    const token = await getToken();

    if (!token) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
        title: "Tavlo - Not Logged In",
        message: "Please open the extension and log in first",
      });
      return;
    }

    try {
      // Save the item
      const result = await saveItem(url, undefined, token);

      if (result.success) {
        // Show success notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
          title: "Tavlo - Saved Successfully! ✓",
          message:
            result.badges && result.badges.length > 0
              ? `Saved! Earned ${result.badges.length} badge(s)`
              : "Link saved to your Tavlo library",
        });
      } else {
        // Show error notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
          title: "Tavlo - Save Failed",
          message: result.error || "Failed to save. Please try again.",
        });
      }
    } catch (error) {
      // Show error notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
        title: "Tavlo - Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save. Please try again.",
      });
    }
  }
});

// Handle authentication messages from the web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    console.log("[Tavlo Extension] Received external message:", message);

    // Handle authentication token from web app
    if (message.type === "TAVLO_EXTENSION_AUTH") {
      const { token, email } = message;

      if (!token) {
        console.error("[Tavlo Extension] No token in auth message");
        sendResponse({ success: false, error: "No token provided" });
        return;
      }

      console.log("[Tavlo Extension] Storing auth token for:", email);

      // Store token and email
      Promise.all([
        setToken(token),
        email ? setUserEmail(email) : Promise.resolve(),
      ])
        .then(() => {
          console.log("[Tavlo Extension] Auth token stored successfully");

          // Don't close the tab - let the web page show success message
          // and handle auto-close with countdown

          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("[Tavlo Extension] Error storing token:", error);
          sendResponse({ success: false, error: error.message });
        });

      // Return true to indicate we'll send response asynchronously
      return true;
    }

    // Handle tab close request from auth page
    if (message.type === "TAVLO_EXTENSION_CLOSE_TAB") {
      console.log("[Tavlo Extension] Received tab close request");

      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id).catch((err) => {
          console.warn("[Tavlo Extension] Could not close tab:", err);
        });
        sendResponse({ success: true });
      } else {
        console.warn("[Tavlo Extension] No tab ID to close");
        sendResponse({ success: false, error: "No tab ID" });
      }

      return;
    }

    sendResponse({ success: false, error: "Unknown message type" });
  },
);

export {};
