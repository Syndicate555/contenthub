import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import storage from '../utils/storage';
import { Item, ItemsResponse } from '../types';

// Production backend URL - MUST use www subdomain
const API_BASE_URL = 'https://www.tavlo.ca';
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

export interface UseInboxItemsOptions {
  status?: 'new' | 'reviewed' | 'pinned' | 'all';
  platform?: string | null;
  limit?: number;
  page?: number;
  q?: string;
}

// Helper to check if demo mode is active
const checkDemoModeFromStorage = async (): Promise<boolean> => {
  try {
    const isDemoMode = await storage.getItem(DEMO_MODE_KEY);
    return isDemoMode === 'true';
  } catch {
    return false;
  }
};

// Helper to get demo token from storage
const getDemoTokenFromStorage = async (): Promise<string | null> => {
  try {
    const token = await storage.getItem(DEMO_TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
};

export const useInboxItems = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * CRITICAL: Token priority order:
   * 1. If user is signed in with Clerk → ALWAYS use Clerk token (real user data)
   * 2. If user is NOT signed in AND demo mode is active → use demo token
   * 
   * This ensures real authenticated users NEVER see demo data
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // PRIORITY 1: Clerk authenticated user - ALWAYS use Clerk token
    if (clerkLoaded && isSignedIn) {
      console.log('[useInboxItems] User is signed in with Clerk - using Clerk token');
      return await getClerkToken();
    }
    
    // PRIORITY 2: Not signed in - check for demo mode
    const isDemoMode = await checkDemoModeFromStorage();
    if (isDemoMode) {
      console.log('[useInboxItems] Not signed in, using Demo mode token');
      return await getDemoTokenFromStorage();
    }
    
    console.log('[useInboxItems] No authentication available');
    return null;
  }, [clerkLoaded, isSignedIn, getClerkToken]);

  // Check if ready to make API calls
  const checkIsReady = useCallback(async (): Promise<boolean> => {
    // If signed in with Clerk, we're ready
    if (clerkLoaded && isSignedIn) {
      return true;
    }
    // If not signed in, check demo mode
    const isDemoMode = await checkDemoModeFromStorage();
    return isDemoMode;
  }, [clerkLoaded, isSignedIn]);
  
  const fetchItems = useCallback(async (options: UseInboxItemsOptions = {}): Promise<ItemsResponse> => {
    const {
      status = 'new',
      platform,
      limit = 20,
      page = 1,
      q,
    } = options;

    // Determine authentication method
    const isClerkAuth = clerkLoaded && isSignedIn;
    const isDemoMode = !isClerkAuth && await checkDemoModeFromStorage();
    
    if (!isClerkAuth && !isDemoMode) {
      console.log('[useInboxItems] Not ready - clerkLoaded:', clerkLoaded, 'signedIn:', isSignedIn, 'demoMode:', isDemoMode);
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const authMethod = isClerkAuth ? 'Clerk' : 'Demo';
      console.log(`[useInboxItems] Getting token... (${authMethod})`);
      
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to retrieve session token');
      }
      console.log('[useInboxItems] Token received:', token.substring(0, 30) + '...');

      // Build query params
      const queryParams = new URLSearchParams({
        status,
        limit: String(limit),
        page: String(page),
      });
      
      if (platform) {
        queryParams.append('platform', platform);
      }
      
      if (q) {
        queryParams.append('q', q);
      }

      const url = `${API_BASE_URL}/api/items?${queryParams}`;
      console.log('[useInboxItems] Fetching:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[useInboxItems] Response status:', response.status);

      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useInboxItems] Error response:', errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      console.log('[useInboxItems] Success! Received', json.data?.length || 0, 'items');
      
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
      console.error('[useInboxItems] Fetch failed:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, clerkLoaded, isSignedIn]);

  return { 
    fetchItems, 
    isLoading, 
    error,
    checkIsReady,
    get isReady() {
      return clerkLoaded && isSignedIn;
    },
  };
};

// Hook for updating item status
export const useUpdateItem = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  
  const getToken = useCallback(async (): Promise<string | null> => {
    // PRIORITY 1: Clerk authenticated user
    if (clerkLoaded && isSignedIn) {
      return await getClerkToken();
    }
    // PRIORITY 2: Demo mode (only if not signed in)
    const isDemoMode = await checkDemoModeFromStorage();
    if (isDemoMode) {
      return await getDemoTokenFromStorage();
    }
    return null;
  }, [clerkLoaded, isSignedIn, getClerkToken]);
  
  const updateItem = useCallback(async (
    itemId: string, 
    payload: { status?: 'new' | 'reviewed' | 'pinned' | 'deleted'; note?: string }
  ): Promise<Item> => {
    const isClerkAuth = clerkLoaded && isSignedIn;
    const isDemoMode = !isClerkAuth && await checkDemoModeFromStorage();
    
    if (!isClerkAuth && !isDemoMode) {
      throw new Error('User not authenticated');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Failed to retrieve session token');
    }

    const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update item: ${errorText}`);
    }

    return response.json();
  }, [getToken, clerkLoaded, isSignedIn]);

  return { updateItem };
};

// Hook for deleting item
export const useDeleteItem = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  
  const getToken = useCallback(async (): Promise<string | null> => {
    // PRIORITY 1: Clerk authenticated user
    if (clerkLoaded && isSignedIn) {
      return await getClerkToken();
    }
    // PRIORITY 2: Demo mode (only if not signed in)
    const isDemoMode = await checkDemoModeFromStorage();
    if (isDemoMode) {
      return await getDemoTokenFromStorage();
    }
    return null;
  }, [clerkLoaded, isSignedIn, getClerkToken]);
  
  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    const isClerkAuth = clerkLoaded && isSignedIn;
    const isDemoMode = !isClerkAuth && await checkDemoModeFromStorage();
    
    if (!isClerkAuth && !isDemoMode) {
      throw new Error('User not authenticated');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Failed to retrieve session token');
    }

    const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete item: ${errorText}`);
    }
  }, [getToken, clerkLoaded, isSignedIn]);

  return { deleteItem };
};
