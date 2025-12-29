# Tavlo Chrome Extension

Save links to your personal Tavlo feed with one click!

## Development Setup

### Prerequisites
- Node.js 18+ installed
- Chrome browser

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The extension will be compiled to the `dist/` directory with hot reloading enabled.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/dist` folder
5. The Tavlo extension icon should appear in your extensions toolbar

### Testing

- Click the extension icon to open the popup (you should see "Hello World!")
- Right-click on any webpage and look for "Save to Tavlo" in the context menu
- Check the console logs for any errors

### Development Workflow

With the dev server running (`npm run dev`):
- Any changes to source files will automatically rebuild the extension
- The extension will auto-reload in Chrome (thanks to CRXJS HMR)
- Check the popup console: Right-click popup → Inspect
- Check the background worker: chrome://extensions/ → "Inspect views: service worker"

## Project Structure

```
extension/
├── src/
│   ├── background/
│   │   └── index.ts              # Service worker (context menu)
│   ├── popup/
│   │   ├── index.html            # Popup HTML
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Main App component
│   │   └── index.css             # Tailwind styles
│   ├── shared/                   # Shared utilities (TODO)
│   └── manifest.json             # Extension manifest
├── public/
│   └── icons/                    # Extension icons
├── dist/                         # Build output (generated)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Build Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Next Steps

Phase 1, Day 2 (Storage & API Client):
- [ ] Create storage utilities (`src/shared/storage.ts`)
- [ ] Create type definitions (`src/shared/types.ts`)
- [ ] Create API client (`src/shared/api.ts`)

Phase 1, Day 3 (Extension Auth):
- [ ] Create extension auth page in main web app
- [ ] Create extension API route
- [ ] Test auth flow end-to-end
