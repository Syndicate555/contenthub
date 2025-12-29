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

## Shared Utilities

### Storage (`src/shared/storage.ts`)
Chrome storage utilities for managing authentication and extension state:
- `setToken(token)` - Store auth token in sync storage
- `getToken()` - Retrieve stored auth token
- `clearToken()` - Remove auth token (logout)
- `setUserEmail(email)` - Store user email for display
- `getUserEmail()` - Retrieve stored email
- `isAuthenticated()` - Check if user has valid token
- `clearAllData()` - Clear all extension data

### Types (`src/shared/types.ts`)
TypeScript type definitions for:
- API request/response types (`CreateItemInput`, `ApiResponse`, etc.)
- Domain models (`Item`, `Badge`, `Domain`, `Tag`, etc.)
- Extension state (`AuthState`, `ExtensionState`, `SaveResult`, etc.)

### API Client (`src/shared/api.ts`)
Backend communication functions:
- `validateToken(token)` - Verify token is valid
- `saveItem(url, note, token)` - Save a link to Tavlo
- `getCurrentUser(token)` - Get user info (future)

## Testing Utilities

To test storage functions in the extension console:

1. Load the extension in Chrome
2. Go to `chrome://extensions/`
3. Click "Inspect views: service worker" under Tavlo extension
4. In the console, test storage:

```javascript
// Import storage utilities (they'll be available via the background script)
chrome.storage.sync.set({ tavlo_auth_token: "test-token" });
chrome.storage.sync.get("tavlo_auth_token", (result) => {
  console.log("Token:", result.tavlo_auth_token);
});
```

## Authentication Flow

The extension uses a **token bridge** approach for authentication:

### How It Works

1. **Get Token from Web App**:
   - User signs in to Tavlo web app
   - Navigate to `/extension-auth` page
   - Web app displays Clerk session token

2. **Copy Token to Extension**:
   - User copies token from web app
   - Opens extension popup
   - Pastes token into login screen

3. **Token Validation**:
   - Extension stores token in Chrome sync storage
   - Makes authenticated API calls with `Authorization: Bearer <token>`
   - Extension API route (`/api/items/extension`) validates token with Clerk

4. **Saving Items**:
   - Extension calls `POST /api/items/extension` with Bearer token
   - Backend processes item through same pipeline as web app
   - Returns saved item + earned badges

### API Endpoints

- **Web App**: `GET /extension-auth` - Displays session token for user
- **Extension API**: `POST /api/items/extension` - Create item with Bearer auth
- **Regular API**: `GET /api/items` - Used for token validation

### Security

- Tokens stored in Chrome sync storage (encrypted by Chrome)
- Tokens verified server-side with Clerk
- Rate limits: 30 saves/min, 200 saves/day (same as web app)
- Demo mode blocked from saving

## Next Steps

Phase 2, Day 4-7 (UI Screens):
- [ ] Build LoginScreen component
- [ ] Build SaveScreen component
- [ ] Build SuccessScreen component
- [ ] Integrate storage & API utilities
- [ ] Test complete user flow
