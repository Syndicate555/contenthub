# Cross-User Data Leakage - Comprehensive Analysis

**Date:** 2025-11-24
**Status:** CRITICAL BUG - Privacy Violation
**Severity:** HIGH - Users can see other users' private data

---

## Executive Summary

When User A logs out and User B logs in, User B momentarily sees User A's data in both the "Today" tab and "Library" tab. User B must manually refresh the page multiple times to see their own data. This represents a critical privacy violation and data leakage issue.

**Impact:** Every user login potentially exposes another user's private data.

---

## Problem Description

### Observed Behavior

**Scenario:**
1. User A (with 63 posts) is logged in and viewing their data
2. User A logs out
3. User B (with 0 posts) logs in
4. **BUG:** User B sees User A's 63 posts displayed on screen
5. User B refreshes the page multiple times
6. Eventually, User B sees their own data (0 posts)

**Affected Components:**
- `/today` page (Today tab)
- `/items` page (Library tab)
- Likely affects all pages using SWR data fetching

**Persistence:**
- Issue occurs in multiple browsers (Chrome, Safari tested)
- Issue persists across all attempted fixes
- Manual page refresh (sometimes multiple times) is the only workaround

---

## Technical Architecture

### Current Stack

```
┌─────────────────────────────────────────────┐
│           React 19 Components               │
│  (Client Components with "use client")      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Custom SWR Hooks                    │
│  - useItems()                               │
│  - useTodayItems()                          │
│  - useCategories()                          │
│  - useProfileData()                         │
│  - useSettingsData()                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         SWR Provider                        │
│  - Global fetcher                           │
│  - Cache management                         │
│  - Auth change detection                    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Clerk Authentication                │
│  - useAuth() hook                           │
│  - userId, isLoaded state                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         API Routes (Next.js)                │
│  - /api/items                               │
│  - /api/categories                          │
│  - /api/dashboard/profile                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Database (Supabase/PostgreSQL)          │
│  - Prisma ORM                               │
│  - User-scoped queries                      │
└─────────────────────────────────────────────┘
```

### Data Flow

**Normal Flow (Expected):**
```
1. User logs in
   → Clerk sets userId
   → useAuth() returns { isLoaded: true, userId: "user_123" }

2. Component renders
   → Calls useItems()
   → useItems checks: isLoaded && userId
   → Constructs SWR key: "/api/items?page=1&limit=16"

3. SWR checks cache
   → Cache miss (first load)
   → Calls fetcher("/api/items?page=1&limit=16")

4. Fetcher makes API request
   → API validates auth via getCurrentUser()
   → API queries DB: WHERE userId = "user_123"
   → Returns user's data

5. SWR caches response
   → Key: "/api/items?page=1&limit=16"
   → Value: { data: [...user's items] }

6. Component displays data
```

**Problematic Flow (Actual):**
```
1. User A logged in, viewing data
   → SWR cache contains:
      - "/api/items?page=1&limit=16" → User A's 63 posts
      - "/api/categories" → User A's categories
      - "/api/items?status=new&limit=20" → User A's today items

2. User A logs out
   → Clerk sets userId to null
   → SWR Provider detects change, triggers window.location.reload()
   → **BUT**: Page reload is asynchronous, takes ~100ms

3. User B logs in (BEFORE page reload completes)
   → Clerk sets userId to "user_B"
   → Components re-render
   → useItems() is called

4. useItems() checks cache
   → SWR key: "/api/items?page=1&limit=16"
   → **CACHE HIT**: Returns User A's 63 posts from cache!
   → Components display User A's data

5. Background: SWR revalidates
   → Makes API request with User B's auth
   → API returns User B's data (0 posts)
   → SWR updates cache
   → **BUT**: Update might be delayed or not trigger re-render

6. User must manually refresh
   → Forces new render cycle
   → Clears any stale state
   → Finally displays correct data
```

---

## Root Cause Analysis

### Primary Issue: React State + SWR Cache Race Condition

The fundamental problem is a **multi-layered race condition** between:
1. Clerk's auth state changes
2. React component rendering
3. SWR cache lookups
4. Browser page reloads

### Layer 1: Clerk Authentication Timing

**How Clerk Updates Auth:**
```javascript
// When user logs in/out, Clerk updates its internal state
// This triggers re-renders in components using useAuth()

const { userId, isLoaded } = useAuth();

// Transitions:
// Logout: userId "user_A" → null
// Login:  userId null → "user_B"
```

**Problem:** Multiple state updates happen in rapid succession:
- `isLoaded` might toggle: true → false → true
- `userId` changes: "user_A" → null → "user_B"
- Each change triggers component re-renders

### Layer 2: React Rendering Lifecycle

**Component Render Order:**
```javascript
function ItemsPage() {
  // 1. Component body executes
  const { userId, isLoaded } = useAuth();
  const { items } = useItems();  // Hooks run during render

  // 2. JSX returned
  return <ItemList items={items} />;

  // 3. Effects run AFTER render
  useEffect(() => {
    // This runs AFTER the component has rendered
  }, [userId]);
}
```

**Problem:** Hooks execute **during** render, effects execute **after** render.
- useItems() accesses SWR cache during render
- Our cleanup logic (window.location.reload) runs in useEffect
- By the time useEffect runs, hooks have already returned stale data

### Layer 3: SWR Cache Behavior

**SWR's Caching Strategy:**
```javascript
// SWR caches by key (URL string)
const { data } = useSWR("/api/items", fetcher);

// Cache structure (simplified):
{
  "/api/items": {
    data: [...],
    timestamp: 1234567890,
    isValidating: false
  }
}
```

**Problem:** Cache keys are NOT user-scoped by default
- User A fetches "/api/items" → cached
- User B fetches "/api/items" → **cache hit** returns User A's data
- SWR then revalidates in background, but stale data already shown

### Layer 4: Browser/Network Timing

**Page Reload Timing:**
```javascript
// Current approach
setTimeout(() => {
  window.location.reload();
}, 100);
```

**Problem:** 100ms delay allows:
- Multiple component renders to occur
- SWR cache to be accessed
- Stale data to be displayed
- User to see wrong data before reload completes

---

## Previous Fix Attempts

### Attempt #1: UserId-Scoped Cache Keys
**Implementation:**
```javascript
const cacheKey = userId ? `${userId}:/api/items` : null;
```

**Why It Failed:**
- Fetcher had to extract URL from prefixed key
- Race conditions persisted: hooks accessed cache before keys updated
- Complex logic made debugging harder
- Components still re-rendered with stale keys during auth transitions

### Attempt #2: Cache Versioning System
**Implementation:**
```javascript
const [cacheVersion, setCacheVersion] = useState(0);
const cacheKey = `${userId}:${cacheVersion}:/api/items`;

// On auth change:
setCacheVersion(prev => prev + 1);
```

**Why It Failed:**
- Version increment happens in useEffect (after render)
- Hooks execute before useEffect, use old version number
- Same timing issue as Attempt #1
- Added complexity without solving core problem

### Attempt #3: Disabled keepPreviousData
**Implementation:**
```javascript
useSWR(key, {
  keepPreviousData: false  // Don't show previous data during transitions
});
```

**Why It Failed:**
- SWR still had data in cache under the same key
- keepPreviousData only affects behavior during key changes
- Doesn't prevent cache hits from returning stale data
- Symptom treatment, not root cause fix

### Attempt #4: Manual Cache Clearing
**Implementation:**
```javascript
useEffect(() => {
  if (userId changed) {
    if (cache instanceof Map) {
      cache.clear();
    }
    mutate(() => true, undefined, { revalidate: true });
  }
}, [userId]);
```

**Why It Failed:**
- useEffect runs AFTER components have already rendered
- Components called useSWR BEFORE cache was cleared
- Timing issue: clear → revalidate happens too late
- Components already displayed stale data by the time clearing happens

### Attempt #5: Force Page Reload on Auth Change
**Implementation:**
```javascript
useEffect(() => {
  if (userId changed) {
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}, [userId]);
```

**Why It Failed:**
- 100ms delay still allows components to render
- React's batching means multiple renders happen quickly
- User sees stale data during the 100ms window
- Page reload is asynchronous, not immediate
- Components render → display stale data → reload starts → user sees wrong data

---

## Why This Is So Difficult To Fix

### 1. Architectural Mismatch

**SWR's Design:**
- Designed for single-user scenarios
- Cache is global, not user-scoped
- "Stale while revalidate" assumes stale data is acceptable
- Optimistic updates and background revalidation

**Our Requirement:**
- Multi-user authentication
- Zero tolerance for cross-user data
- Immediate, accurate data on auth changes
- Privacy-critical application

**The Mismatch:**
SWR fundamentally assumes that showing stale data briefly is okay. We require that cross-user data is NEVER shown, even momentarily.

### 2. React's Rendering Model

**React's Guarantee:**
- State changes trigger re-renders
- Hooks execute during render
- Effects execute after render (and after paint)

**Our Problem:**
- We need to prevent renders from accessing stale cache
- But we can only clear cache in effects (after renders)
- Circular dependency: need to clear before render, can only clear after render

### 3. Timing Cannot Be Controlled

**Multiple Async Systems:**
```
Clerk Auth State Change
    ↓ (timing unknown)
React Re-render
    ↓ (synchronous)
Hook Execution (useSWR)
    ↓ (synchronous)
SWR Cache Lookup
    ↓ (synchronous - RETURNS STALE DATA)
Component Displays Data
    ↓ (synchronous)
Browser Paint
    ↓ (timing unknown)
useEffect Runs
    ↓ (timing unknown)
Cache Clear Attempt
    ↓ (too late)
Page Reload Trigger
    ↓ (100ms delay)
Page Reload Starts
    ↓ (timing unknown - browser dependent)
New Page Load
```

**Problem:** By the time we can intervene (useEffect), damage is done (stale data shown).

### 4. Browser/JavaScript Constraints

**Cannot:**
- Intercept renders before they happen
- Prevent SWR cache access
- Make window.location.reload() synchronous
- Guarantee effects run before renders
- Control Clerk's auth update timing

**Can:**
- React to auth changes (too late)
- Clear cache (too late)
- Reload page (too late)

---

## Testing Results

### Test Environment
- Browser: Chrome, Safari
- Next.js: 16.0.3
- React: 19
- SWR: Latest version
- Clerk: Latest version

### Test Case: User Switching

**Setup:**
- User A: 63 posts
- User B: 0 posts

**Steps:**
1. Login as User A
2. Verify 63 posts shown
3. Logout
4. Login as User B

**Expected Result:**
- User B sees 0 posts immediately

**Actual Result (Consistent Across All Attempts):**
- User B sees User A's 63 posts for 1-3 seconds
- After page reload completes, sees correct data (0 posts)
- Sometimes requires 2-3 manual refreshes

**Reproducibility:** 100% - happens every time

---

## Current Implementation State

### File: `src/components/providers/swr-provider.tsx`
```javascript
export function SWRProvider({ children }: SWRProviderProps) {
  const { userId, isLoaded } = useAuth();
  const mountKeyRef = useRef(0);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    const previousUserId = previousUserIdRef.current;
    const currentUserId = userId;

    if (previousUserId === undefined) {
      previousUserIdRef.current = currentUserId;
      return;
    }

    // Any auth change - force complete remount
    if (previousUserId !== currentUserId) {
      console.log("[Auth] User changed, forcing remount");
      mountKeyRef.current += 1;
      previousUserIdRef.current = currentUserId;

      // Force reload after delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [userId, isLoaded]);

  return (
    <SWRConfig key={mountKeyRef.current} value={{ fetcher, ... }}>
      {children}
    </SWRConfig>
  );
}
```

### File: `src/hooks/use-items.ts`
```javascript
export function useItems(params: ItemsQueryParams = {}) {
  const { isLoaded, userId } = useAuth();
  const url = buildItemsUrl(params);

  const shouldFetch = isLoaded && userId;

  const { data, error, isLoading, isValidating, mutate } = useSWR<ItemsResponse>(
    shouldFetch ? url : null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
    }
  );

  return {
    items: data?.data || [],
    pagination: data?.meta || null,
    isLoading: !shouldFetch || (isLoading && !data),
    isValidating,
    error: error?.message || null,
    mutate,
  };
}
```

**Issues with Current Implementation:**
1. `useEffect` runs after `useItems()` has already accessed cache
2. `setTimeout(reload, 100)` allows multiple renders before reload
3. `key={mountKeyRef.current}` remounting doesn't clear SWR's global cache
4. No mechanism to prevent cache access during auth transitions

---

## Potential Solutions (Evaluation)

### Solution 1: Abandon SWR, Use React Query
**Pros:**
- React Query has better multi-user support
- Built-in query key scoping
- More control over cache invalidation

**Cons:**
- Complete rewrite of all data fetching
- Large refactoring effort
- May face similar timing issues
- Not addressing root cause

**Recommendation:** ❌ Too much effort, doesn't guarantee fix

### Solution 2: Server-Side Only Rendering
**Pros:**
- No client-side cache
- Auth checks happen on server
- Impossible to show wrong user's data

**Cons:**
- Slower user experience (no client caching)
- Requires architectural changes
- Defeats purpose of SWR/client-side fetching

**Recommendation:** ❌ Defeats purpose of using SWR

### Solution 3: Synchronous Cache Clear Before Render
**Pros:**
- Would solve the timing issue
- Keeps SWR

**Cons:**
- **IMPOSSIBLE** in React
- Cannot run code before component render in React's model
- useEffect always runs after render

**Recommendation:** ❌ Not technically feasible

### Solution 4: User-Scoped SWR Provider Instances
**Concept:**
- Create separate SWR provider per user
- Mount/unmount provider on auth changes
- Each user gets isolated cache

**Implementation:**
```javascript
function App() {
  const { userId } = useAuth();

  return (
    <SWRConfig key={userId}>  {/* Remount on userId change */}
      {children}
    </SWRConfig>
  );
}
```

**Pros:**
- Cache is truly isolated per user
- Simple concept
- Leverages React's reconciliation

**Cons:**
- Still has timing issues (remount happens during render)
- Children might render before provider remounts
- Doesn't prevent initial stale data flash

**Recommendation:** ⚠️ Might help but not guaranteed

### Solution 5: Immediate, Synchronous Page Reload
**Concept:**
- Detect auth change as early as possible
- Reload page immediately, no delay
- Don't let any renders happen

**Implementation:**
```javascript
// In ClerkProvider wrapper or auth interceptor
onAuthChange(() => {
  window.location.reload();  // No setTimeout
});
```

**Pros:**
- Prevents renders with new userId
- Forces complete reset
- Simple, nuclear option

**Cons:**
- Still some delay (reload not instant)
- Poor UX (visible reload)
- Might still show flash of wrong data

**Recommendation:** ⚠️ Best option so far, but UX cost

### Solution 6: Loading State During Auth Transitions
**Concept:**
- Detect auth state is changing
- Show loading screen
- Block all data fetching
- Only allow after auth fully settled

**Implementation:**
```javascript
function AuthLoadingGate({ children }) {
  const { userId, isLoaded } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      setIsTransitioning(true);
      // Wait for auth to settle
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  if (!isLoaded || isTransitioning) {
    return <LoadingScreen />;
  }

  return children;
}
```

**Pros:**
- Prevents rendering with wrong data
- Clean UX (shows loading instead of wrong data)
- Gives time for cache to clear

**Cons:**
- Delays showing correct data
- Still relies on timing (500ms arbitrary)
- Doesn't guarantee cache is cleared

**Recommendation:** ⚠️ Could work with careful tuning

### Solution 7: Clerk-Specific Logout Redirect
**Concept:**
- On logout, redirect to /sign-in with full page navigation
- Never render app with null userId
- On login success, redirect to app with full page navigation

**Implementation:**
```javascript
// Use Clerk's built-in redirects
<ClerkProvider
  afterSignOutUrl="/sign-in"
  afterSignInUrl="/today"
>
```

**Pros:**
- Full page navigations clear everything
- Leverages Clerk's built-in flow
- Simple to implement

**Cons:**
- Doesn't handle in-app user switching
- Assumes logout always goes to sign-in page
- Might still have issues if user navigates back

**Recommendation:** ✅ Should be done regardless, might help

### Solution 8: Hybrid Approach
**Concept:**
Combine multiple strategies:
1. Use Clerk redirects for logout/login
2. Add loading gate during auth transitions
3. Clear SWR cache on auth change
4. Force revalidation after clearing
5. Disable all caching during transition

**Recommendation:** ✅ Most likely to succeed

---

## Recommended Next Steps

### Priority 1: Verify API Layer
Before any client fixes, confirm:
- ✅ API endpoints correctly filter by authenticated user
- ✅ getCurrentUser() returns correct user
- ✅ No caching at API level

### Priority 2: Implement Hybrid Solution

**Phase 1: Clerk Configuration**
```javascript
<ClerkProvider
  afterSignOutUrl="/sign-in"
  signInFallbackRedirectUrl="/today"
  signUpFallbackRedirectUrl="/today"
>
```

**Phase 2: Auth Transition Gate**
```javascript
// Block rendering during auth changes
<AuthTransitionGate>
  <SWRProvider>
    {children}
  </SWRProvider>
</AuthTransitionGate>
```

**Phase 3: Enhanced Cache Management**
```javascript
// Clear cache immediately when gate opens
// Use user-scoped provider keys
// Force full revalidation
```

### Priority 3: Add Monitoring
- Log all auth state changes
- Log all SWR cache accesses
- Track userId through entire flow
- Measure timing between events

### Priority 4: Testing Protocol
1. Clear browser cache
2. Login as User A
3. Verify data shown
4. **Logout** (watch for flash)
5. **Login as User B** (watch for User A's data)
6. Document exact timing and behavior
7. Check network tab for API calls
8. Check console for logs

---

## Open Questions

1. **Clerk Behavior:** When exactly does Clerk update `userId`? Can we intercept earlier?
2. **SWR Internals:** Can we hook into SWR's cache access to block stale reads?
3. **React Timing:** Is there any way to run code synchronously before component render?
4. **Browser Caching:** Could service workers or browser cache be involved?
5. **Clerk Sessions:** Does Clerk maintain session state that persists across reloads?

---

## Conclusion

This is a **fundamental architectural challenge** stemming from the mismatch between:
- SWR's single-user, optimistic-update design
- React's render-then-effect model
- Our multi-user, privacy-critical requirements
- JavaScript's asynchronous nature

No simple fix exists because we need to prevent something (stale cache access) that happens **before** we can intervene (useEffect). This is a timing problem that cannot be solved with current React patterns.

**The only reliable solutions involve:**
1. Preventing renders entirely during auth transitions (loading gates)
2. Using full page navigations instead of client-side auth changes
3. Abandoning client-side caching entirely (server-only)
4. Switching to a different data fetching library with better multi-user support

**Recommended Path Forward:**
Implement the Hybrid Approach (Solution #8) with aggressive monitoring and testing. Accept that some level of loading state/delay is necessary to guarantee data privacy.
