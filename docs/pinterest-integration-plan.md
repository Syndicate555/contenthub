# Pinterest Integration Plan

## Goal & Success Criteria
- Let users connect Pinterest, import their saved pins (favourites/boards), and manage them alongside existing items with the same AI pipeline, XP, and Today flows.
- Preserve security (encrypted tokens, least privilege scopes), avoid duplicates, and keep sync predictable and observable.

## What Exists (use as blueprint)
- Social connections: `socialConnection` model with encrypted `accessToken`/`refreshToken`, `lastSyncAt`, `lastSyncCursor`, `syncEnabled`, provider-specific unique constraint. Twitter integration (see `src/lib/twitter-api.ts`, `src/lib/twitter-sync.ts`, `src/app/api/auth/twitter/*`, `src/app/api/connections/twitter/route.ts`) is the closest template.
- Item ingestion: `processItem` pipeline handles extraction + summarization + XP/badges; items deduped via `@@unique([userId, importSource, externalId])`.
- Settings UI already renders platform cards from a config map (`PLATFORMS` in `src/app/(dashboard)/settings/SettingsPageClient.tsx`) and sync/disconnect actions.

## Pinterest API Snapshot (assumptions to validate)
- OAuth 2.0 Authorization Code flow; scopes likely `pins:read`, `boards:read`, `user_accounts:read` (and `pins:read` covers saved pins). Supports refresh tokens.
- Base endpoints: `https://api.pinterest.com/v5/user_account`, `/v5/user_account/boards` (or `/v5/boards`), `/v5/boards/{id}/pins`, optional `/v5/pins/{id}`. Pagination via `bookmark` tokens.
- Pin fields we care about: `id`, `link` (destination URL), `title`, `description`, `created_at`, `board_id`, `board_owner`, `media.images.orig.url` (best image). Some pins have no `link` (image-only).
- Rate limits: enforce client-side pacing and handle 429 with backoff.

## Data Model & Config Changes
- Items: add `importMetadata` (Json) to persist provider-specific context (board id/name/url, pin url, media URL, note about being image-only) without overloading `note`.
- SocialConnection: optionally add `syncPreferences` (Json) to store board selections and last bookmark per board, and `scopes` string[] for auditing (fits in the existing table). Reuse `lastSyncCursor` if we keep a single global bookmark; otherwise store per-board cursor in `syncPreferences`.
- Env/config: `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`, `PINTEREST_REDIRECT_URI` (or derive from `NEXT_PUBLIC_APP_URL`), `PINTEREST_SCOPES` (optional override). Document token encryption requirement (`TOKEN_ENCRYPTION_KEY` already used).

## OAuth & Token Management
- New helpers (`src/lib/pinterest-oauth.ts`):
  - Build auth URL (state + PKCE if Pinterest supports it; otherwise state-only).
  - Exchange code for tokens, refresh access token, revoke token.
  - Fetch current user profile to store `providerUserId` and handle/username.
- Routes:
  - `GET /api/auth/pinterest`: start flow, set cookies for state/(verifier if PKCE), redirect to Pinterest.
  - `GET /api/auth/pinterest/callback`: validate state, exchange code, fetch user, upsert `socialConnection` (`provider="pinterest"`), encrypt tokens, set `tokenExpiresAt`, store scopes.
- Token refresh flow similar to Twitter’s `ensureValidToken`, updating DB when refreshed.

## Pinterest API Client (`src/lib/pinterest-api.ts`)
- `getPinterestConnection(userId)`, `disconnectPinterest` (revoke + delete).
- `ensureValidToken(connection)` with refresh logic and optimistic expiry threshold (e.g., 5m).
- Fetchers:
  - `fetchBoards(connection)` to list boards (used for preferences UI).
  - `fetchPins(options)` that accepts board IDs (all by default), page size, and optional bookmark; returns pins + next bookmark + whether more exists.
  - Normalize pins to `{ id, title, description, link, board: { id, name }, imageUrl, createdAt, url: pinterestPinUrl }`.
- Error handling: distinguish auth expiry (401), permission issues (403), rate limit (429), and transient errors. Surface actionable messages up the stack.

## Sync Pipeline (`src/lib/pinterest-sync.ts`)
- Inputs: userId, optional list of board IDs, optional max pins, optional since marker (bookmark or “stop when duplicate found”).
- Steps per sync:
  1) Validate connection & syncEnabled.
  2) Resolve boards to sync (preferences if set; else all boards). If no boards, short-circuit.
  3) For each board, paginate through pins (respect max overall count and rate limits).
  4) Deduplicate using `externalId` + `importSource="pinterest"`; stop early on already-imported pins if ordering is newest-first.
  5) Choose target URL: prefer `pin.link` (destination), fallback to pinterest pin URL.
  6) Run through `processItem({ url, note, userId })` where `note` can mention board + creator.
  7) After pipeline, patch the item with `importSource="pinterest"`, `externalId=pin.id`, `imageUrl` (from API if better), and `importMetadata` (board id/name, pin url, destination url, isImageOnly, media attribution).
  8) Track successes/skips/failures; lightweight delay between requests for rate limits.
  9) Update `lastSyncAt` and store bookmark(s) for incremental fetch (global in `lastSyncCursor` or per-board in `syncPreferences`).
- Return a `SyncResult` aligned with Twitter’s shape for UI reuse.

## UI/UX Changes
- Settings page:
  - Add Pinterest card to `PLATFORMS` with icon, brand color, description (“Import saved pins”).
  - Wire `connectPath` to new auth route and reuse Sync/Disconnect buttons.
  - Optional: board picker modal (lists boards via `/api/connections/pinterest/boards`) that writes to `syncPreferences`; show selected boards summary on the card.
- Item surfaces:
  - Add Pinterest to `PlatformIcon` map and Today sidebar source mapping so pins render with the right badge/icon.
- Copy/notifications: mirror Twitter success/error handling; include handle/board name in messages where possible.

## API Routes
- `POST /api/connections/pinterest` → trigger sync (uses preferences/max count params optional).
- `DELETE /api/connections/pinterest` → disconnect.
- `GET /api/connections/pinterest/boards` → list boards for UI selection (auth-protected).
- Extend `/api/dashboard/settings` data to include Pinterest connection metadata (import counts already covered by the groupBy).

## Content Extraction Strategy for Pins
- When `pin.link` exists: pipeline processes destination URL; keep Pinterest image for thumbnail override.
- When no external link: create a minimal content payload using pin title/description and call `summarizeWithVision` with the image, or short-circuit with a handcrafted summary/tag set so the item is still useful.
- Consider adding a Pinterest branch in `extractor` to avoid scraping login-walled pages (return structured content from pin metadata instead).

## Security, Privacy, and Resilience
- Encrypt all tokens (reuse `encryptToken/decryptToken`), store only required scopes/user IDs.
- Validate scopes before syncing; if missing `pins:read`, prompt reconnect.
- Handle revocation/expired consent gracefully by disabling `syncEnabled` and surfacing a reconnect CTA.
- Respect rate limits with backoff and cap per-sync volume (configurable).

## Testing & QA Plan
- Unit: token refresh logic, pin normalization, dedupe detection, “image-only pin” fallback path.
- Integration (mock fetch): OAuth callback happy/error paths, sync flow importing new pins vs. duplicates, board preference filtering.
- UI: Settings card renders states (connected/disconnected/syncing), board picker interaction, Today/Items displays Pinterest icon.
- Manual: Full OAuth round-trip in dev with a test Pinterest app; sync from a board with/without external links; disconnect flow.

## Delivery Steps (execution checklist)
1) Add env docs and guardrails for required Pinterest keys/scopes.
2) Schema updates for `importMetadata` (and `syncPreferences` if used); regenerate Prisma client.
3) Implement Pinterest OAuth helper + routes; add connection logging.
4) Build API client + sync service; add API routes for sync/boards/disconnect.
5) Integrate Pinterest into settings UI and platform/icon mappings; optional board picker.
6) Add extractor fallback for Pinterest pins (image-only handling).
7) Instrument logging + error surfaces; add rate-limit friendly delays.
8) Write tests/mocks; perform manual end-to-end verification.

## Open Questions / Decisions
- Do we require board selection (favourites) before first sync, or default to “all boards” with an opt-out?
- Should we support scheduled auto-syncs (e.g., cron/queue) or keep manual sync for now?
- How many pins per sync should be capped by default (e.g., 50/100) to control costs?
- Do we need to persist pin creator/profile info for display, or is board name sufficient?
