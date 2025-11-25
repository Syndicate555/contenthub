The leak is consistent with shared client caches + HTTP caching across users.

Likely causes

SWR cache is global and not user-scoped. Keys are just URLs (/api/items, /api/categories, /api/items?status=new&limit=20, etc.). When User A prefetches or views data, that response lives in the global cache. When User B logs in, the same keys hit the same cache and return User A’s data until a revalidation occurs.
The SWR provider remount (key={mountKeyRef.current}) does not create a new cache map; without a custom provider: () => new Map(), the global cache persists across users. The 100ms setTimeout reload also leaves a window where stale data renders.
Prefetchers (prefetchTodayItems, prefetchCategories, nav hover) populate the shared cache for User A; those entries are reused when User B arrives because keys are identical.
API responses for user-scoped data set cache headers that allow browser-level caching: /api/items sets Cache-Control: private, max-age=10, stale-while-revalidate=30; /api/categories caches for 30s; /api/domains is public but benign. With cookie auth, the browser can serve cached JSON for the same path to the next user. SWR + fetch default cache mode will accept that cached response, so even after a full reload within the TTL, User B can receive User A’s cached response before any revalidation.
Hooks don’t include userId in the key (e.g., useItems, useTodayItems, useCategories, useProfileData, useSettingsData), so even with user changes, SWR keys don’t change, and stale data persists.
Auth transition handling happens in useEffect (after render) with an async reload; there’s no gating that prevents rendering data during the transition.
Where to look in code

src/components/providers/swr-provider.tsx: global SWR config, no per-user provider, reload delay.
src/hooks/use-items.ts, src/hooks/use-dashboard.ts: SWR keys are URL-only; no user scoping; keepPreviousData false but still reuse cached payload.
Nav prefetch in src/app/(dashboard)/layout.tsx and use-items prefetch helpers populating shared cache.
API cache headers in src/app/api/items/route.ts and src/app/api/categories/route.ts (and any other user-scoped endpoints) that set Cache-Control with max-age/stale-while-revalidate.
Recommended fixes (conceptual, not implementing yet)

User-scope and isolate caches:
Add a per-user SWR provider map (provider: () => new Map()) keyed by userId, so changing users instantiates a fresh cache before children render.
Include userId in SWR keys (e.g., ${userId}:${url}) or use a fetcher/provider that is keyed per user to avoid cross-user cache hits.
Avoid nav prefetch across users unless the cache is user-scoped.
Disable HTTP caching for user data:
For user-specific endpoints (/api/items, /api/items/[id], /api/categories, /api/user/_, /api/connections_, /api/xp/award), set Cache-Control: no-store (or at least no-cache) and/or use fetch(..., { cache: 'no-store' }) in the SWR fetcher to bypass the browser HTTP cache.
Remove stale-while-revalidate/max-age on user data or add Vary: Cookie and still prefer no-store to be safe with cookie auth.
Auth transition gating:
Introduce a gate that blocks rendering/fetching during user transitions (when userId changes or isLoaded is false/transitioning) to prevent any SWR hook from running with stale cache.
Prefer full page navigations on sign-out/sign-in (afterSignOutUrl, afterSignInUrl) and avoid delayed setTimeout reloads.
Revalidation/clearing strategy:
On auth change, clear/replace the SWR cache map synchronously (via provider remount with new Map) and revalidate post-mount; avoid relying on mutate + effect after render.
Consider turning off hover prefetch or make it user-scoped.
Verify API ownership checks:
Ensure every API route still filters by current user; with caching disabled and keys user-scoped, the leak should stop, but double-check DB queries remain WHERE userId = current.
Next steps to validate

Add logs/metrics around auth transitions, SWR key construction, and whether fetches hit network vs. cache.
Reproduce with browser cache disabled to confirm HTTP caching involvement; then with per-user SWR provider to confirm cache isolation fixes the flash.
Test sign-out/sign-in flow with hard no-store headers to ensure no stale payloads are served.
