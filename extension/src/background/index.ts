// Background service worker for Tavlo extension
// Handles context menu and Chrome extension events

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tavlo extension installed successfully!");

  // Create context menu item for saving links
  chrome.contextMenus.create({
    id: "save-to-tavlo",
    title: "Save to Tavlo",
    contexts: ["link", "page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-tavlo") {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    console.log("Save to Tavlo clicked for URL:", url);
    // TODO: Implement save functionality
  }
});

export {};
