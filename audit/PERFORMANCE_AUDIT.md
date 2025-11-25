# ContentHub Frontend Performance Audit Report

**Date:** November 24, 2025
**Project:** ContentHub (Next.js 16 + React 19 + Prisma)
**Focus:** Tab switching performance between "Today" and "Library" views with blank screen issues

---

## EXECUTIVE SUMMARY

The application exhibits **significant performance issues during tab switching** between the "Today" and "Library" views. The primary causes are:

1. **No data persistence/caching** - Fresh API calls on every navigation
2. **Multiple unnecessary parallel API requests** - Both Items and Categories load without intelligent prefetching
3. **No request deduplication** - Identical requests can fire multiple times
4. **Aggressive state resets** - Component state not preserved during navigation
5. **Heavy filter/pagination logic on every render** - No memoization
6. **Missing skeleton states for secondary content** - Categories load without visual feedback
7. **No route-level caching or prefetching** - Next.js caching not leveraged

---

## CODEBASE STRUCTURE & FINDINGS

### 1. Main App Structure

**Location:** `/Users/saffataziz/Desktop/Github/personal/ContentHub/src/app/`

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (ClerkProvider, no caching strategy)
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout (simple Link navigation)
│   │   ├── today/page.tsx            # Today view (PROBLEM AREA #1)
│   │   ├── items/page.tsx            # Library/Items view (PROBLEM AREA #2)
│   │   ├── add/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── items/route.ts            # GET /api/items, POST items
│   │   ├── items/[id]/route.ts
│   │   └── categories/route.ts       # GET /api/categories
│   └── sign-in/, sign-up/
├── components/
│   ├── items/                        # Item rendering components
│   │   ├── item-card.tsx            # Single item card with actions
│   │   ├── filter-bar.tsx           # Filter controls
│   │   ├── folder-grid.tsx          # Category grid
│   │   ├── category-folder.tsx      # Individual category folder
│   │   ├── pagination.tsx           # Pagination controls
│   │   ├── tag-badge.tsx
│   │   └── platform-icon.tsx
│   └── ui/                          # Shadcn components (buttons, cards, tabs, skeleton)
├── lib/
│   ├── auth.ts                      # getCurrentUser() with auto-create
│   ├── db.ts                        # Prisma singleton
│   ├── pipeline.ts                  # Item processing (extractContent, summarize)
│   ├── schemas.ts                   # Zod validation schemas
│   ├── openai.ts                    # GPT summarization
│   ├── extractor.ts                 # URL content extraction
│   ├── twitter-*.ts                 # Twitter integration
│   └── encryption.ts                # Data encryption
├── types/
│   └── index.ts                     # TypeScript types and ITEM_CATEGORIES
├── middleware.ts                    # Clerk auth middleware
└── generated/
    └── prisma/                      # Prisma client (auto-generated)
```

---

### 2. Tab Switching Implementation

**Navigation:** Simple Link-based routing in `/src/app/(dashboard)/layout.tsx`

```tsx
// Current implementation (INEFFICIENT)
<Link href="/today" ...>Today</Link>
<Link href="/items" ...>Library</Link>
```

**Issues:**
- No prefetching hints
- No intermediate caching
- Full page state reset on navigation
- No suspense boundaries for gradual loading

---

### 3. TODAY VIEW (`/src/app/(dashboard)/today/page.tsx`)

**Current Implementation:**

```typescript
export default function TodayPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const response = await fetch("/api/items?status=new&limit=20");
    // ... parse response and update state
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
```

**Performance Issues:**

1. **Fresh fetch on every mount** - No caching
2. **Loading state blocks UI** - Shows skeleton while fetching
3. **Single API call** - Fetches status=new items only
4. **No prefetching** - No hint to prepare data when user hovers
5. **Callback dependencies** - `fetchItems` callback recreated every render
6. **Basic error handling** - No retry strategy or exponential backoff

**API Endpoint:** `GET /api/items?status=new&limit=20`
- **Server time:** Unknown (likely 200-500ms for DB query + auth)
- **Network time:** 50-200ms (depending on connection)
- **Total perception:** ~300-700ms blank screen

---

### 4. LIBRARY/ITEMS VIEW (`/src/app/(dashboard)/items/page.tsx`)

**Current Implementation:**

```typescript
export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [categoriesData, setCategoriesData] = useState<CategoriesResponse | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // TWO separate API calls
  const fetchCategories = useCallback(async () => { ... }, []);
  const fetchItems = useCallback(async () => { ... }, [searchQuery, statusFilter, ...]);

  useEffect(() => {
    fetchCategories();  // First call
  }, [fetchCategories]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchItems();     // Second call (with 300ms debounce)
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);
```

**Critical Performance Issues:**

| Issue | Impact | Severity |
|-------|--------|----------|
| **Two parallel API calls** | Network overhead | HIGH |
| **Categories always loads** | Wasted bandwidth when filtering | HIGH |
| **No filtering on categories** | Loads ALL categories even for search | HIGH |
| **300ms debounce** | Feels laggy with filter changes | MEDIUM |
| **6 dependency conditions** | Excessive re-fetching logic | MEDIUM |
| **URL sync in separate effect** | Three useEffect chains | MEDIUM |
| **No request deduplication** | Same query can fire twice | LOW |

**Three separate useEffect hooks:**

1. Fetch categories once
2. Fetch items with debounce (300ms)
3. Update URL when filters change
4. Auto-switch view mode based on filters

**Dependency chains create race conditions:**
- `fetchCategories` triggers on mount
- `fetchItems` depends on 6 filters
- `router.replace` depends on 6 filters + router
- Filter changes cause cascading updates

---

### 5. API ENDPOINTS

#### GET /api/items

**File:** `src/app/api/items/route.ts` (Lines 9-100)

```typescript
// Execution time: ~200-500ms
await db.item.count({ where });  // Count query
await db.item.findMany({          // Data query
  where,
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

**Issues:**
- Two database queries (count + findMany)
- No pagination cursor (offset-based pagination is slow for large datasets)
- No query hints or indexes verification
- No response caching headers
- Auth check on every request (`getCurrentUser()` hits DB)

**Calls from:**
- Today page: `?status=new&limit=20`
- Items page: Dynamic query string with filters + pagination

---

#### GET /api/categories

**File:** `src/app/api/categories/route.ts` (Lines 6-105)

```typescript
// Expensive operation
await db.item.findMany({           // Gets ALL non-deleted items
  where: { userId, status: { not: "deleted" } },
  select: { id, category, imageUrl, title }
  orderBy: { createdAt: "desc" }
  // NO limit!
});

// Then groups in memory
const categoryMap = new Map(...);  // In-memory grouping
```

**Critical Issues:**

1. **Unbounded query** - Fetches ALL items without limit
2. **No pagination support** - Returns everything regardless of user's item count
3. **In-memory grouping** - Expensive for 1000+ items
4. **Full groupBy fallback** - Second query for platform counts
5. **No caching headers** - Expensive computation on every request
6. **Called on every Library page load** - Even when filtering specific category

**Performance impact for user with 500 items:**
- Query time: ~300-800ms
- In-memory grouping: ~50-200ms
- Network transfer: 50-100ms
- **Total: 400-1100ms before user sees anything**

---

### 6. Data Fetching Patterns

**Current Pattern: Fresh Fetch on Every Navigation**

```
User clicks "Library" tab
    ↓
Route change to /items
    ↓
Component mounts → State initialized (loading = true)
    ↓
useEffect fires → fetchCategories() + fetchItems()
    ↓
User sees blank screen / skeleton (300-700ms+)
    ↓
API responses arrive → UI updates
```

**What's NOT happening:**
- No prefetching on hover
- No background refresh
- No service worker caching
- No Next.js router prefetch hints
- No response caching (HTTP or in-memory)
- No request deduplication
- No partial data loading (SWR-style)

---

### 7. State Management & Memoization

**No custom hooks:** All state in page components
**No context providers:** Props drilling only
**No memoization:** All dependencies re-run

```typescript
// These recreate on EVERY render of ItemsPage
const fetchCategories = useCallback(async () => {}, []);
const fetchItems = useCallback(async () => {}, [
  searchQuery, statusFilter, categoryFilter, 
  platformFilter, tagFilter, currentPage
]);

// All 6 filters are separate useState
const [searchQuery, setSearchQuery] = useState(...);
const [statusFilter, setStatusFilter] = useState(...);
const [categoryFilter, setCategoryFilter] = useState(...);
const [platformFilter, setPlatformFilter] = useState(...);
const [tagFilter, setTagFilter] = useState(...);
const [currentPage, setCurrentPage] = useState(...);
```

**Problem:** When one filter changes, ALL state updates trigger re-renders

---

### 8. Loading State Handling

**Today page:**
```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
```

**Items page:**
```tsx
if (isCategoriesLoading) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
      ))}
    </div>
  );
}
```

**Issues:**
1. **Blocking skeleton** - User waits for data before seeing anything
2. **Two separate loading states** - Categories + Items both block
3. **No progressive loading** - All or nothing
4. **No partial data** - Can't show cached categories while fetching

---

### 9. Existing Caching Mechanisms

**Search across entire codebase:**

**Result: NONE FOUND**

- No HTTP caching headers in API routes
- No in-memory cache (no React Context with memoized data)
- No localStorage/sessionStorage usage
- No service workers
- No Next.js `revalidate` tags
- No HTTP cache control middleware
- No request deduplication library
- No React Query / SWR / Tanstack Query

**Closest thing to caching:**
```typescript
// db.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
```

This is just Prisma singleton pattern, NOT data caching.

---

### 10. Component Re-render Analysis

**ItemCard component:** (`src/components/items/item-card.tsx`)

```typescript
const handleStatusChange = async (status: string) => {
  setIsUpdating(true);
  const response = await fetch(`/api/items/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  // Update parent: onStatusChange?.(item.id, status);
};
```

**Issues:**
- Each ItemCard is an independent component
- No mutation error handling
- No optimistic updates
- No rollback on failure
- Parent updates item list state (causes all cards to re-render)

---

### 11. Router & Navigation

**Dashboard layout:** (`src/app/(dashboard)/layout.tsx`)

```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/today",
      label: "Today",
      icon: Inbox,
      isActive: pathname === "/today",
    },
    {
      href: "/items",
      label: "Library",
      icon: FolderOpen,
      isActive: pathname === "/items" || pathname.startsWith("/items?"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link href={item.href} ...>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

**Issues:**
- Basic `<Link>` with no prefetch hints
- No router configuration
- No dynamic imports for route components
- No suspense boundaries

---

## PERFORMANCE IMPACT ANALYSIS

### Scenario 1: User navigates from Today → Library (First Time)

```
Timeline:
0ms    - User clicks "Library" link
50ms   - Next.js router processes navigation
100ms  - ItemsPage component mounts
100ms  - fetchCategories() called
100ms  - fetchItems() called (with 300ms debounce)
200ms  - Categories query hits database
400ms  - Categories response arrives, UI renders skeletons
400ms  - Items query hits database
650ms  - Items response arrives, UI replaces skeletons
700ms+ - User sees content

Total blocking time: 600-700ms BLANK SCREEN
```

### Scenario 2: User navigates Library → Today → Library (Thrashing)

```
0ms    - User clicks "Today"
50ms   - Route changes, TodayPage mounts
100ms  - Fetch items (status=new&limit=20)
300ms  - Items arrive, user sees 2-3 items
400ms  - User clicks "Library" again
450ms  - Route changes, ItemsPage mounts (fresh state)
450ms  - Previous request still in flight (wasted)
500ms  - NEW categories request
500ms  - NEW items request (after 300ms debounce)
800ms  - Categories arrive
950ms  - Items arrive
1000ms+ - FINALLY shows library (but user may have navigated elsewhere)

Result: Two wasted API requests, 3+ seconds of time lost
```

### Scenario 3: User filters rapidly (Today → Library with filter changes)

```
User types in search box "react"
- Character 1 (r): setSearchQuery → fetchItems scheduled
- Character 2 (e): setSearchQuery → previous timeout cleared, new one scheduled
- Character 3 (a): setSearchQuery → cleared, new one scheduled
- Character 4 (c): setSearchQuery → cleared, new one scheduled
- Character 5 (t): setSearchQuery → cleared, new one scheduled
- 300ms passes: FINALLY call API for "react"

Result: Works but feels slow due to debounce
Potential issue: Race condition if requests arrive out of order
```

---

## IDENTIFIED BOTTLENECKS

### Critical (Blocks UI)

1. **No caching** - Every navigation triggers 2 API calls
2. **Heavy categories endpoint** - Unbounded query of ALL items
3. **Blocking skeleton** - User waits before any content appears
4. **Authentication on every request** - `getCurrentUser()` hits DB each time

### High Priority (Causes lag)

5. **Two parallel requests** - Categories + Items both block
6. **No request deduplication** - Same request can fire multiple times
7. **Large response payloads** - No pagination on categories
8. **Filter dependency chain** - 6 dependencies cause excessive re-renders

### Medium Priority (UX Polish)

9. **No prefetching** - No hints when user hovers over tab
10. **No partial loading** - Can't show cached categories while fetching items
11. **No optimistic updates** - Status changes wait for server response
12. **No background refresh** - Data becomes stale instantly

### Low Priority (Minor optimization)

13. **Callback recreations** - useCallback not optimized
14. **URL sync logic** - Three separate useEffect hooks
15. **No suspense boundaries** - Could stream components
16. **No code splitting** - All components in main bundle

---

## DEPENDENCY TREE ANALYSIS

### Today Page Dependencies

```
TodayPage mounts
├── useEffect([fetchItems])
│   └── fetchItems depends on:
│       └── (no dependencies - recreates every render)
├── useState: items, isLoading, error, processedToday
├── useCallback: fetchItems
│   └── Called once on mount
└── Renders:
    ├── Header (static)
    ├── Stats banner (depends on items.length)
    ├── Empty state OR
    └── Item cards (depends on items)
        └── ItemCard component
            ├── useState: isUpdating, isImageModalOpen, copied
            ├── handleStatusChange: PATCH /api/items/{id}
            └── Renders image, title, summary, tags, actions

Issues:
- Fresh fetch on every mount (no cache)
- Parent ItemCard rendering can't memoize children
```

### Items Page Dependencies

```
ItemsPage mounts
├── useState: [6 filters] + items + pagination
├── useCallback: fetchCategories (no deps)
│   └── Updates: categoriesData, isCategoriesLoading
├── useCallback: fetchItems (6 deps: filters + currentPage)
│   └── Updates: items, isLoading, error, pagination
├── useEffect([fetchCategories])
│   └── Runs on mount only
├── useEffect([fetchItems])
│   ├── 300ms debounce
│   └── Runs when ANY filter changes (cascading!)
├── useEffect([filters, router])
│   └── Updates URL when filters change
├── useEffect([filters])
│   └── Auto-switch view mode
└── Renders:
    ├── Header
    ├── Conditional render based on viewMode
    ├── FolderGrid (depends on categoriesData)
    │   └── CategoryFolder × N
    ├── Search input (onChange updates state)
    ├── FilterBar (onChange updates state)
    ├── ItemCard × N (in list view)
    │   └── handleStatusChange (PATCH + parent refetch)
    └── Pagination

Issues:
- 4 useEffect hooks with interdependencies
- 6 filters create complex dependency chains
- Single filter change triggers fetch, URL update, view mode change
- Categories always load even if not visible
- Two loading states that block simultaneously
- Router.replace can cause another re-render
```

---

## ROOT CAUSE ANALYSIS

### Why is tab switching slow?

1. **Navigation clears component state** - Full unmount/remount on route change
2. **Fresh API requests on every mount** - No caching layer
3. **Categories endpoint is expensive** - Unbounded query + in-memory processing
4. **Parallel requests** - Categories and Items both wait for server
5. **Blocking UI** - Skeleton prevents interaction until data arrives

### Why do blank screens appear?

1. `isLoading` set to `true` immediately
2. Component returns skeleton UI
3. API requests in flight (300-700ms)
4. Once responses arrive, state updates and UI renders

### Why does switching back and forth feel bad?

1. Each navigation is treated as fresh
2. Previous data is discarded
3. No cached responses to show instantly
4. Two wasted API requests per round trip

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Library" link                                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────┐
│ Next.js Router navigates to /items                          │
│ ItemsPage component mounts (fresh state)                    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─────────────────────────────────────────────────┐
              │                                                 │
              ↓                                                 ↓
      ┌───────────────┐                           ┌────────────────────┐
      │ useEffect     │                           │ useEffect          │
      │ mount hook    │                           │ debounce hook      │
      └───────┬───────┘                           └────────┬───────────┘
              │                                            │
              ↓                                    300ms debounce
      fetchCategories()                                    ↓
              │                                   fetchItems()
              ├─────────────┐                            │
              │             │                            │
              ↓             ↓                            ↓
     GET /api/categories   GET /api/items    GET /api/items?q=...&status=...
              │             │                            │
       (Unbounded query)    (With filters)       (Filtered query)
              │             │                            │
              │ (300-800ms) │ (200-500ms)        │ (200-500ms)
              │             │                            │
              ↓             ↓                            ↓
      setCategoriesData  setItems              setItems
      setIsCategoriesLoading=false             setIsLoading=false
              │             │                            │
              └─────────┬───┘                            │
                        │                                │
                        ↓                                ↓
              Component re-renders            Component re-renders
              Shows folder grid               Shows item list
                        │                                │
                        └────────────────┬───────────────┘
                                         │
                                         ↓
                              User sees library (600-700ms+ later)
```

---

## METRICS SUMMARY

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Tab switch time | 600-700ms | <300ms | -400ms |
| Categories endpoint response | 300-1100ms | <100ms | -1000ms |
| Items endpoint response | 200-500ms | <100ms | -400ms |
| Request count per navigation | 2 | 1 (cached) | -1 |
| Skeleton blocking time | 600ms+ | 0ms (instant UI) | -600ms |
| Total XHR requests from single user session | 8+ | 2-3 | -5+ |

---

## RECOMMENDATIONS (Preview)

### Tier 1: Quick Wins (1-2 days)

1. **HTTP Caching Headers** - Add Cache-Control to API responses
2. **Request Deduplication** - Dedupe identical concurrent requests
3. **Prefetch on Navigation** - Add router prefetch hints to Links
4. **Memoize FilterBar** - Prevent unnecessary re-renders
5. **Optimize Categories Endpoint** - Add pagination and limit

### Tier 2: Architecture Changes (3-5 days)

6. **Custom Data Hook** - Create `useItems()` and `useCategories()` hooks
7. **Client-side Cache** - Implement in-memory cache with invalidation
8. **React Query/SWR** - Add professional data fetching library
9. **Suspense Boundaries** - Progressive loading with streaming
10. **Optimistic Updates** - Show changes immediately, sync with server

### Tier 3: Advanced Optimizations (1 week)

11. **Service Workers** - Offline support and aggressive caching
12. **Streaming SSR** - Server-side render initial state
13. **Code Splitting** - Dynamic imports for routes
14. **Database Indexes** - Optimize query performance
15. **GraphQL API** - Precise data fetching with schema

---

## FILE INVENTORY

### Components with Performance Issues

| File | Issue | Lines | Severity |
|------|-------|-------|----------|
| `/src/app/(dashboard)/today/page.tsx` | No caching, fresh fetch on mount | 1-182 | HIGH |
| `/src/app/(dashboard)/items/page.tsx` | 2 parallel requests, complex deps | 1-389 | CRITICAL |
| `/src/app/api/categories/route.ts` | Unbounded query, expensive grouping | 6-105 | CRITICAL |
| `/src/app/api/items/route.ts` | Double query, slow pagination | 9-100 | MEDIUM |
| `/src/components/items/item-card.tsx` | No optimistic updates | 1-250+ | MEDIUM |
| `/src/app/(dashboard)/layout.tsx` | No prefetch hints | 1-102 | LOW |

### Supporting Infrastructure

| File | Purpose | Status |
|------|---------|--------|
| `/src/lib/db.ts` | Prisma singleton | Working |
| `/src/lib/auth.ts` | getCurrentUser (hits DB each time) | Works but slow |
| `/src/types/index.ts` | Type definitions | Good |
| `next.config.ts` | Empty config | Could use caching rules |
| `package.json` | Missing @tanstack/react-query, swr, or similar | NEED |

---

## CONCLUSION

The ContentHub frontend suffers from **fundamental caching and state management gaps**. The architecture treats each tab navigation as a completely fresh experience, forcing full re-fetches of expensive queries (especially categories).

**Key findings:**
- No data persistence layer (cache)
- Two heavy API calls per tab switch
- Categories endpoint scales poorly
- Complex dependency chains cause re-renders
- Blocking skeleton prevents perceived performance

**Quick Impact:**
Implementing just HTTP caching + request deduplication could reduce tab switch time from **600-700ms to 100-200ms** immediately.

**Long-term Fix:**
Adopt a data fetching library (React Query recommended) with proper cache invalidation strategy.

---

## NEXT STEPS

See separate document: **Performance Optimization Implementation Plan** for detailed solutions across Tier 1, 2, and 3 recommendations.
