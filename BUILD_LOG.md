# ContentHub Build & Issue Log

Comprehensive record of analysis, issues found, and fixes implemented during recent development and debugging sessions.

## Cross-User Data Leakage (Critical Privacy Bug)
- **Symptom:** After User A logs out and User B logs in, User B briefly sees User A’s Today/Library data until multiple manual refreshes.
- **Root causes identified:**
  - SWR global cache not scoped per user; keys were URL-only, so cached payloads were reused across users.
  - SWR provider remount didn’t create a new cache map; reload delay left a window to render stale data.
  - API cache headers allowed browser caching of authenticated JSON (max-age/stale-while-revalidate), serving prior user data.
  - Prefetchers filled shared cache with User A’s data; auth-change handling ran in useEffect (too late).
- **Fixes implemented:**
  - Per-user SWR cache isolation (`provider: () => new Map()`, keyed by userId) and fetcher with `cache: "no-store"`.
  - Disabled browser caching on user-scoped APIs: `/api/items`, `/api/categories` set `Cache-Control: no-store`.
  - Kept auth-protected endpoints and ownership checks intact; avoided stale cache rendering on auth transitions.

## Profile Tab Performance & Caching
- **Issues:** Slow tab switch with skeleton flashing on every visit.
- **Adjustments:**
  - Stable cache key `/api/dashboard/profile` with per-user freshness (30s) to skip revalidation on quick returns.
  - Prefetch hook warms the same key; SWR renders cached data first; skeleton only when no cached data.
  - Server fallback hydration preserved; loading gated by presence of cached data.

## Settings Tab Performance & Caching
- **Issues:** Same skeleton/delay on revisits.
- **Adjustments:**
  - Stable cache key `/api/dashboard/settings`, per-user freshness (30s), and prefetch warming.
  - Skeleton gated by cached data presence; server fallback passed into client for instant render.

## Layout & UI Refinements (LinkedIn-like 3-Column)
- **Goal:** Reduce unused gutters, adopt a balanced three-column layout with a wider center column and side rails, while keeping overall width comfortable (LinkedIn feel).
- **Changes:**
  - Dashboard container width tuned to `max-w-screen-xl` (capped at 1400px) with larger side padding (`px-4 md:px-8 lg:px-12`) to avoid over-wide pages.
  - Today page grid: equal side columns and center 1.5× width (`lg:grid-cols-[280px_minmax(0,1.5fr)_280px]`), consistent gaps, and a right-rail placeholder for AI Assistant.
  - Removed overly aggressive center max-width and kept symmetry for side rails.

## Performance Audits & Findings (General)
- Route guarding: middleware runs on all routes; consider narrowing matcher to reduce overhead.
- Client-heavy pages: Today/Library/Profile/Settings initially client-only fetch; benefits from server hydration and prefetching patterns now partially applied.
- API hotspots: `/api/items` (count + find + XP aggregation) and `/api/categories` (groupBy + per-category fetch) noted for latency; potential future optimizations.
- Prefetch: Navigation hover prefetch implemented for Today/Library/Profile/Settings to warm SWR caches.

## Timeline of Key Fixes
1. **Cross-user leak**: Scoped SWR caches per user; disabled browser cache on user data endpoints.
2. **Profile caching**: Stable key + freshness + prefetch + skeleton gating.
3. **Settings caching**: Same pattern as Profile, with server fallback passed through.
4. **Layout rework**: 3-column Today layout, balanced widths, wider right rail; global container width reduced with better padding.

## Open Considerations / Future Work
- Further narrow middleware matcher if needed to shave navigation overhead.
- Optimize heavy APIs (`/api/items`, `/api/categories`) for reduced latency.
- Extend server-side hydration patterns to other pages for first-paint performance.
- Continue monitoring for any residual cache edge cases on auth transitions.
