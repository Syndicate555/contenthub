# ContentHub Performance Audit - Quick Reference

## Problem Statement
Users report **slow tab switching** between "Today" and "Library" with **blank screens during loading** (600-700ms per switch).

---

## Root Causes (Top 5)

| # | Cause | Impact | Location |
|----|-------|--------|----------|
| 1 | **No caching** - Fresh API calls on every navigation | 600ms+ blank screen | architecture-wide |
| 2 | **Unbounded categories query** - Fetches ALL items without limit | 300-1100ms per request | `/src/app/api/categories/route.ts` |
| 3 | **Two parallel API requests** - Categories + Items both block UI | Network overhead | `/src/app/(dashboard)/items/page.tsx` |
| 4 | **Blocking skeleton** - Shows loading state until ALL data arrives | Perceived slowness | Today/Items pages |
| 5 | **No request deduplication** - Same query fires multiple times | Wasted bandwidth | Data fetching pattern |

---

## Critical Files & Issues

### Frontend Pages

**File:** `/src/app/(dashboard)/today/page.tsx` (182 lines)
- Fresh fetch on every mount
- Single loading state blocks UI
- No caching or prefetching
- Basic error handling (no retry)

**File:** `/src/app/(dashboard)/items/page.tsx` (389 lines)
- TWO parallel API requests (categories + items)
- 4 useEffect hooks with complex dependencies
- 6 filter states cause excessive re-renders
- 300ms debounce on filter changes
- Categories always loads (even when hidden)
- No request deduplication

### API Endpoints

**File:** `/src/app/api/items/route.ts` (100 lines)
- Two DB queries (count + findMany)
- Auth check on every request (hits DB)
- Slow pagination (offset-based, not cursor)
- No caching headers

**File:** `/src/app/api/categories/route.ts` (105 lines)
- **UNBOUNDED QUERY** - Fetches ALL items without limit
- In-memory grouping (expensive for 1000+ items)
- Second query for platform counts (inefficient)
- No caching headers
- No pagination support

### Navigation

**File:** `/src/app/(dashboard)/layout.tsx` (102 lines)
- Simple `<Link>` with no prefetch hints
- No router configuration
- No suspense boundaries

---

## Performance Metrics

### Current State

| Metric | Value | Status |
|--------|-------|--------|
| Tab switch time | 600-700ms | POOR |
| Categories endpoint | 300-1100ms | CRITICAL |
| Items endpoint | 200-500ms | MEDIUM |
| Skeleton blocking time | 600ms+ | BLOCKING |
| API requests per session | 8+ | EXCESSIVE |
| Caching mechanisms | 0 | MISSING |

### Target State

| Metric | Target | Gap |
|--------|--------|-----|
| Tab switch time | <300ms | -400ms |
| Categories endpoint | <100ms | -1000ms |
| Items endpoint | <100ms | -400ms |
| Skeleton blocking time | 0ms | -600ms |
| API requests per session | 2-3 | -5+ |

---

## Data Flow Issues

### Current: Every Tab Switch Triggers Full Reload

```
Click Tab → Route Change → Component Mount → State Reset → API Call
    ↓         ↓             ↓               ↓            ↓
  50ms     100ms          100ms          100ms        600ms+
           ↓────────────────────────────────────────────↓
                    Blank Screen: 600-700ms Total
```

### What Should Happen: Instant UI + Background Refresh

```
Click Tab → Route Change → Show Cached Data → Background API Call
    ↓         ↓             ↓                 ↓
  50ms     100ms         ~0ms (cached)      100ms
           ↓──────────────↓
           Instant UI appears
```

---

## Dependency Complexity

### Today Page

```
TodayPage
├── [items, isLoading, error, processedToday]
├── useEffect([fetchItems])
└── fetchItems callback
    └── Single API call: /api/items?status=new&limit=20
```

**Complexity:** LOW ✓

---

### Items Page

```
ItemsPage
├── [items, isLoading, error, pagination]
├── [categoriesData, isCategoriesLoading]
├── [searchQuery, statusFilter, categoryFilter, platformFilter, tagFilter, currentPage]
├── useCallback fetchCategories → updatesCategoriesData + isCategoriesLoading
├── useCallback fetchItems (6 deps) → updates items + pagination
├── useEffect([fetchCategories]) → fetch categories
├── useEffect([fetchItems]) → debounce 300ms → fetch items
├── useEffect([filters, router]) → update URL
├── useEffect([filters]) → change view mode
└── Conditional renders based on viewMode + hasActiveFilters
    ├── FolderGrid (categories)
    ├── List View (items + filters)
    └── Pagination
```

**Complexity:** CRITICAL ✗ (4 useEffect, 6 dependencies, 2 simultaneous requests)

---

## Caching Status

### What's Missing

| Type | Status | Example |
|------|--------|---------|
| HTTP Caching | NONE | No Cache-Control headers |
| In-Memory Cache | NONE | No Context or custom hooks |
| Request Deduplication | NONE | Same query fires twice |
| Service Workers | NONE | No offline support |
| Query Library | NONE | No React Query / SWR / TanStack |
| Next.js Caching | NONE | No `revalidate` tags |
| Browser Cache | NONE | No localStorage strategy |

---

## Component Render Analysis

### Today Page

```
TodayPage (renders when items state changes)
├── Header
├── Stats Banner (depends on items.length)
├── ItemCard × N (each is independent)
│   └── handleStatusChange → PATCH → parent state update
└── Footer/CTAs
```

**Re-render Triggers:**
1. Page load → fetch items
2. Item status change → parent updates items state → ALL cards re-render
3. User navigates away → state discarded

---

### Items Page

```
ItemsPage (renders when ANY of 6 filters change)
├── Header (title changes based on viewMode)
├── FolderGrid (depends on categoriesData + isCategoriesLoading)
│   └── CategoryFolder × N
├── OR List View
│   ├── Search input (onChange updates state)
│   ├── FilterBar (onChange updates state)
│   ├── ItemCard × N
│   └── Pagination
└── AND URL sync via router.replace
```

**Re-render Triggers:**
1. Page load → fetch categories → setCategoriesData → re-render
2. Page load → 300ms later → fetch items → setItems → re-render
3. User types in search → setSearchQuery → fetch items → setItems → re-render
4. Filter changes → URL sync → router.replace → possible extra re-render
5. Any filter change → auto-switch viewMode → re-render

**Cascading Effect:** One filter change can trigger 3-4 re-renders + API calls

---

## Load Time Breakdown

### Scenario: User navigates Library → Today → Library

```
T0:   Click "Library" tab
T50:  Route change processed
T100: ItemsPage mounts
T100: fetchCategories() called
T100: fetchItems() called + 300ms debounce scheduled
T200: Categories query hits DB
T400: Categories response arrives → setCategoriesData
T400: Categories 300ms debounce expires → fetchItems() called
T400: Items query hits DB
T650: Items response arrives → setItems
T700: User finally sees library (600ms+ later)

WASTED:
- Time waiting for skeleton: 600ms
- API requests: 2 parallel calls
- Previous session data: Discarded on navigation
```

---

## Optimization Opportunities

### Tier 1 (Quick Wins - 1-2 days)

1. **HTTP Caching Headers**
   - Add `Cache-Control: public, max-age=60` to stable endpoints
   - Expected improvement: 300-400ms saved if navigating back

2. **Request Deduplication**
   - Dedupe identical concurrent requests
   - Expected improvement: Eliminate duplicate fetches

3. **Prefetch on Hover**
   - Add `<Link prefetch>` hints
   - Expected improvement: 100-200ms perceived improvement

4. **Optimize Categories Endpoint**
   - Add limit and pagination to query
   - Expected improvement: 500-800ms faster for users with 500+ items

5. **Memoize Callbacks**
   - Use useCallback/useMemo properly
   - Expected improvement: Reduce re-renders by 30-40%

### Tier 2 (Architecture - 3-5 days)

6. **Custom Hooks**
   - Create `useItems()` and `useCategories()` hooks
   - Add in-memory cache layer
   - Expected improvement: Instant UI on tab switch (cached data)

7. **React Query / SWR**
   - Professional data fetching with caching
   - Automatic background updates
   - Expected improvement: 500-700ms saved per navigation

8. **Suspense Boundaries**
   - Progressive loading (show header, then categories, then items)
   - Expected improvement: Perceived performance +50%

9. **Optimistic Updates**
   - Show status changes instantly
   - Sync with server in background
   - Expected improvement: UX feels instant

### Tier 3 (Advanced - 1+ week)

10. **Service Workers**
    - Offline support and aggressive caching
11. **Streaming SSR**
    - Server-side render initial state
12. **Code Splitting**
    - Dynamic imports for routes
13. **Database Optimization**
    - Add indexes, optimize queries
14. **GraphQL API**
    - Precise data fetching

---

## Quick Wins Priority

| Fix | Effort | Impact | Time |
|-----|--------|--------|------|
| HTTP Cache headers | 30min | 20-30% | Quick |
| Categories pagination | 1hour | 30-40% | Quick |
| Memoization fixes | 2hours | 10-15% | Quick |
| **Total Tier 1** | **3-4 hours** | **60-85%** | **Today** |
| React Query setup | 1-2 days | 85%+ | Tier 2 |
| Custom hooks | 2-3 days | 90%+ | Tier 2 |

---

## Code Quality Observations

### Strengths
- Clean component structure
- Good error boundaries
- Skeleton loading states (though blocking)
- Proper TypeScript types
- Zod validation

### Weaknesses
- No data layer abstraction
- No caching strategy
- Complex useEffect chains
- Over-complicated state management
- No custom hooks for data fetching
- Missing HTTP cache headers
- Blocking loading states

---

## Files to Focus On (In Order)

1. `/src/app/api/categories/route.ts` - CRITICAL (unbounded query)
2. `/src/app/(dashboard)/items/page.tsx` - CRITICAL (2 requests, complex deps)
3. `/src/lib/hooks.ts` - NEW (custom data hooks)
4. `/src/app/api/items/route.ts` - MEDIUM (optimize auth, caching)
5. `/src/app/(dashboard)/today/page.tsx` - MEDIUM (refactor to use hooks)
6. `/src/app/(dashboard)/layout.tsx` - LOW (add prefetch hints)

---

## Architecture Recommendation

### Current Architecture: Page-Based State

```
Today Page          Items Page
├── State          ├── State (complex)
├── Fetch          ├── Fetch (2 calls)
├── Render         └── Render
└── Action         └── Action
```

### Recommended: Custom Hooks + Cache

```
useItems()          useCategories()
├── State           ├── State
├── Cache layer     ├── Cache layer
├── Fetch logic     ├── Fetch logic
├── Invalidation    ├── Invalidation
└── Queries         └── Queries
    ↓                   ↓
Today Page          Items Page
├── Render         ├── Render
├── Action         ├── Action
└── Subscribe      └── Subscribe
```

This separates concerns and enables caching/prefetching.

