import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, ItemsResponse } from '../types';
import { storage } from '../utils/storage';

// Production backend URL
const API_BASE_URL = 'https://www.tavlo.ca';
const RECENT_SEARCHES_KEY = '@tavlo_recent_searches';
const MAX_RECENT_SEARCHES = 10;
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

// ==================== Types ====================

export interface PlatformData {
  platform: string;
  label?: string;
  count: number;
}

export interface AuthorData {
  author: string;
  count: number;
}

export interface CategoryData {
  category: string;
  label: string;
  count: number;
  icon?: string;
  thumbnails?: string[];
}

export interface DiscoveryData {
  categories: CategoryData[];
  platforms: PlatformData[];
  authors: AuthorData[];
  totalItems: number;
}

export interface SearchFilters {
  q?: string;
  category?: string | null;
  platform?: string | null;
  author?: string | null;
  tag?: string | null;
}

// ==================== Helper Functions ====================

const checkDemoModeFromStorage = async (): Promise<boolean> => {
  try {
    const isDemoMode = await storage.getItem(DEMO_MODE_KEY);
    return isDemoMode === 'true';
  } catch {
    return false;
  }
};

const getDemoTokenFromStorage = async (): Promise<string | null> => {
  try {
    return await storage.getItem(DEMO_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * CRITICAL: Token priority order:
 * 1. If user is signed in with Clerk → ALWAYS use Clerk token (real user data)
 * 2. If user is NOT signed in AND demo mode is active → use demo token
 * 
 * This ensures real authenticated users NEVER see demo data
 */
const getAuthToken = async (
  getClerkToken: () => Promise<string | null>,
  clerkLoaded: boolean,
  isSignedIn: boolean
): Promise<string | null> => {
  // PRIORITY 1: Clerk authenticated user - ALWAYS use Clerk token
  if (clerkLoaded && isSignedIn) {
    console.log('[useSearch] User is signed in with Clerk - using Clerk token');
    return await getClerkToken();
  }
  
  // PRIORITY 2: Not signed in - check for demo mode
  const isDemoMode = await checkDemoModeFromStorage();
  if (isDemoMode) {
    console.log('[useSearch] Not signed in, using Demo mode token');
    return await getDemoTokenFromStorage();
  }
  
  console.log('[useSearch] No authentication available');
  return null;
};

// ==================== useDiscovery Hook ====================

export const useDiscovery = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState<DiscoveryData>({
    categories: [],
    platforms: [],
    authors: [],
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check readiness
  useEffect(() => {
    const checkReady = async () => {
      if (clerkLoaded) {
        if (isSignedIn) {
          setIsReady(true);
        } else {
          const isDemoMode = await checkDemoModeFromStorage();
          setIsReady(isDemoMode);
        }
      }
    };
    checkReady();
  }, [clerkLoaded, isSignedIn]);

  const fetchDiscovery = useCallback(async () => {
    if (!clerkLoaded) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useDiscovery] Fetching discovery data...');
      const token = await getAuthToken(getClerkToken, clerkLoaded, isSignedIn);
      
      if (!token) {
        console.log('[useDiscovery] No token available');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const json = await response.json();
      console.log('[useDiscovery] Success!', {
        categories: json.data?.categories?.length || 0,
        platforms: json.data?.platforms?.length || 0,
        authors: json.data?.authors?.length || 0,
      });

      setData({
        categories: json.data?.categories || [],
        platforms: json.data?.platforms || [],
        authors: json.data?.authors || [],
        totalItems: json.data?.totalItems || 0,
      });

    } catch (err: any) {
      console.error('[useDiscovery] Error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getClerkToken, clerkLoaded, isSignedIn]);

  useEffect(() => {
    if (isReady) {
      fetchDiscovery();
    }
  }, [isReady]);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchDiscovery,
    isReady,
  };
};

// ==================== useSearch Hook ====================

export const useSearch = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [results, setResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [isReady, setIsReady] = useState(false);

  // Check readiness
  useEffect(() => {
    const checkReady = async () => {
      if (clerkLoaded) {
        if (isSignedIn) {
          setIsReady(true);
        } else {
          const isDemoMode = await checkDemoModeFromStorage();
          setIsReady(isDemoMode);
        }
      }
    };
    checkReady();
  }, [clerkLoaded, isSignedIn]);

  const search = useCallback(async (
    filters: SearchFilters,
    page: number = 1,
    append: boolean = false
  ): Promise<void> => {
    if (!clerkLoaded) {
      setError('Auth not loaded');
      return;
    }

    if (page === 1) {
      setIsSearching(true);
      setResults([]);
    }
    setError(null);
    setHasSearched(true);

    try {
      console.log('[useSearch] Searching with filters:', filters);
      const token = await getAuthToken(getClerkToken, clerkLoaded, isSignedIn);
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build query params
      const queryParams = new URLSearchParams({
        limit: '20',
        page: String(page),
      });

      if (filters.q) queryParams.append('q', filters.q);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.platform) queryParams.append('platform', filters.platform);
      if (filters.author) queryParams.append('author', filters.author);
      if (filters.tag) queryParams.append('tag', filters.tag);

      const url = `${API_BASE_URL}/api/items?${queryParams}`;
      console.log('[useSearch] Fetching:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const json = await response.json();
      console.log('[useSearch] Found', json.data?.length || 0, 'results');

      if (append && page > 1) {
        setResults(prev => [...prev, ...(json.data || [])]);
      } else {
        setResults(json.data || []);
      }

      setTotalResults(json.meta?.total || json.data?.length || 0);
      setHasMore(json.meta?.hasMore ?? false);
      setCurrentPage(page);
      setCurrentFilters(filters);

    } catch (err: any) {
      console.error('[useSearch] Error:', err.message);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [getClerkToken, clerkLoaded, isSignedIn]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isSearching) return;
    await search(currentFilters, currentPage + 1, true);
  }, [hasMore, isSearching, currentFilters, currentPage, search]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setHasSearched(false);
    setTotalResults(0);
    setCurrentFilters({});
    setCurrentPage(1);
  }, []);

  return {
    results,
    isSearching,
    error,
    hasSearched,
    totalResults,
    hasMore,
    search,
    loadMore,
    clearSearch,
    isReady,
  };
};

// ==================== Recent Searches (Local Storage) ====================

export const useRecentSearches = () => {
  const [searches, setSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setSearches(JSON.parse(stored));
      }
    } catch (err) {
      console.error('[RecentSearches] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const newSearches = [
        query.trim(),
        ...searches.filter(s => s.toLowerCase() !== query.trim().toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);

      setSearches(newSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    } catch (err) {
      console.error('[RecentSearches] Save error:', err);
    }
  };

  const removeSearch = async (query: string) => {
    try {
      const newSearches = searches.filter(s => s !== query);
      setSearches(newSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    } catch (err) {
      console.error('[RecentSearches] Remove error:', err);
    }
  };

  const clearAll = async () => {
    try {
      setSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error('[RecentSearches] Clear error:', err);
    }
  };

  return {
    searches,
    isLoading,
    addSearch,
    removeSearch,
    clearAll,
  };
};
