import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Item, ItemsResponse } from '../types';
import { storage } from '../utils/storage';

// Production backend URL - MUST use www subdomain
const API_BASE_URL = 'https://www.tavlo.ca';
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

// ==================== Types ====================

export interface CategoryData {
  category: string;   // Slug ID (e.g., "tech", "productivity") - USE THIS FOR FILTERING
  label: string;      // Display name (e.g., "Technology")
  count: number;      // Number of items in this category
  icon?: string;      // Icon name (e.g., "Cpu", "Briefcase") - map to Lucide
  thumbnails?: string[]; // Array of thumbnail URLs - use first as folder preview
}

export interface PlatformData {
  platform: string;  // e.g., "twitter.com"
  label?: string;    // Display name
  count: number;
}

export interface AuthorData {
  author: string;   // e.g., "Paul Graham"
  count: number;
}

export interface CategoriesResponse {
  ok: boolean;
  data: {
    categories: CategoryData[];
    platforms?: PlatformData[];
    authors?: AuthorData[];
    totalItems: number;
  };
}

export interface UseLibraryItemsOptions {
  category?: string | null;
  platform?: string | null;
  author?: string | null;
  limit?: number;
  page?: number;
  q?: string;
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
    console.log('[useLibrary] User is signed in with Clerk - using Clerk token');
    return await getClerkToken();
  }
  
  // PRIORITY 2: Not signed in - check for demo mode
  const isDemoMode = await checkDemoModeFromStorage();
  if (isDemoMode) {
    console.log('[useLibrary] Not signed in, using Demo mode token');
    return await getDemoTokenFromStorage();
  }
  
  console.log('[useLibrary] No authentication available');
  return null;
};

// ==================== useCategories Hook ====================

export const useCategories = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [authors, setAuthors] = useState<AuthorData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check readiness
  useEffect(() => {
    const checkReady = async () => {
      if (clerkLoaded) {
        // If signed in with Clerk, ready immediately
        if (isSignedIn) {
          setIsReady(true);
        } else {
          // If not signed in, check demo mode
          const isDemoMode = await checkDemoModeFromStorage();
          setIsReady(isDemoMode);
        }
      }
    };
    checkReady();
  }, [clerkLoaded, isSignedIn]);

  const fetchCategories = useCallback(async () => {
    if (!clerkLoaded) {
      console.log('[useCategories] Clerk not loaded yet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken(getClerkToken, clerkLoaded, isSignedIn);
      
      if (!token) {
        console.log('[useCategories] No token available');
        setIsLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/api/categories`;
      console.log('[useCategories] Fetching:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[useCategories] Response status:', response.status);

      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const json: CategoriesResponse = await response.json();
      console.log('[useCategories] Success!', {
        categories: json.data?.categories?.length || 0,
        platforms: json.data?.platforms?.length || 0,
        authors: json.data?.authors?.length || 0,
        totalItems: json.data?.totalItems || 0,
      });

      setCategories(json.data?.categories || []);
      setPlatforms(json.data?.platforms || []);
      setAuthors(json.data?.authors || []);
      setTotalItems(json.data?.totalItems || 0);

    } catch (err: any) {
      console.error('[useCategories] Fetch failed:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getClerkToken, clerkLoaded, isSignedIn]);

  // Auto-fetch when ready
  useEffect(() => {
    if (isReady) {
      fetchCategories();
    }
  }, [isReady]);

  return {
    categories,
    platforms,
    authors,
    totalItems,
    isLoading,
    error,
    refetch: fetchCategories,
    isReady,
  };
};

// ==================== useLibraryItems Hook ====================

export const useLibraryItems = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchItems = useCallback(async (options: UseLibraryItemsOptions = {}): Promise<ItemsResponse> => {
    const {
      category,
      platform,
      author,
      limit = 50,
      page = 1,
      q,
    } = options;

    if (!clerkLoaded) {
      throw new Error('Auth not loaded yet');
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken(getClerkToken, clerkLoaded, isSignedIn);

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build query params
      const queryParams = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });

      // Add filters
      if (category) queryParams.append('category', category);
      if (platform) queryParams.append('platform', platform);
      if (author) queryParams.append('author', author);
      if (q) queryParams.append('q', q);

      const url = `${API_BASE_URL}/api/items?${queryParams}`;
      console.log('[useLibraryItems] Fetching:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[useLibraryItems] Response status:', response.status);

      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      console.log('[useLibraryItems] Success! Received', json.data?.length || 0, 'items');

      return {
        ok: json.ok ?? true,
        data: json.data || [],
        meta: json.meta || {
          page,
          limit,
          total: json.data?.length || 0,
          totalPages: 1,
          hasMore: false,
        },
      };

    } catch (err: any) {
      console.error('[useLibraryItems] Fetch failed:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClerkToken, clerkLoaded, isSignedIn]);

  return {
    fetchItems,
    isLoading,
    error,
    isReady,
  };
};
