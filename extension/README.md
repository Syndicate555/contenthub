# Tavlo Chrome Extension

Save links to your personal Tavlo feed with one click. Supports Twitter, LinkedIn, TikTok, YouTube, Reddit, and more!

## Features

✨ **One-Click Saving**: Save any link with a single click from the extension popup or right-click menu

🎯 **Smart URL Detection**: Automatically detects the correct URL for posts on:

- Twitter/X (handles modals and SPA routing)
- LinkedIn (extracts post URLs from feeds)
- TikTok (finds video URLs in the For You page)
- YouTube, Reddit, Instagram, and more

📝 **Add Notes**: Optionally add context to any saved link

🏆 **Gamification**: Earn badges as you save more content

🔒 **Secure**: Uses OAuth-style authentication with Clerk

## Installation

### From Chrome Web Store

1. Visit the Tavlo Extension on Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Click "Login with Tavlo" and authenticate with your account

### For Development

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

## Usage

### Saving from the Popup

1. Click the Tavlo extension icon in your browser toolbar
2. The current tab's URL will be automatically detected
3. (Optional) Add a note
4. Click "Save to Tavlo"

### Saving from the Context Menu

1. Right-click any link or page
2. Select "Save to Tavlo"
3. The link will be saved instantly

### Editing URLs

If the extension doesn't detect the correct URL (e.g., on a feed page), you can:

1. Click "Edit URL" in the popup
2. Paste the correct link
3. Click "Save URL"

## Supported Platforms

The extension has special handling for:

- **Twitter/X**: Detects tweet URLs even when viewing in modals
- **LinkedIn**: Extracts post URLs from the feed
- **TikTok**: Finds video URLs on the For You page
- **YouTube**: Standard video URLs
- **Reddit**: Posts and comments
- **Instagram**: Posts
- Plus any standard webpage!

## Privacy

Your privacy is important to us:

- ✅ We only access the current tab when you open the extension
- ✅ No tracking or analytics
- ✅ Authentication tokens are stored securely
- ✅ Data is only sent when you explicitly save a link

See our full [Privacy Policy](./PRIVACY.md) for details.

## Development

### Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extension Manifest V3

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Support

Having issues? Please open an issue on our GitHub repository or contact support@tavlo.ca.

## License

Copyright © 2024 Tavlo. All rights reserved.
