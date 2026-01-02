import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useDemoMode } from '../contexts/DemoContext';

/**
 * useApiToken - A unified hook to get authentication tokens
 * Works with both Clerk authentication AND Demo mode
 * 
 * Priority: Demo mode token > Clerk token
 */
export const useApiToken = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isDemoMode, getDemoToken } = useDemoMode();

  /**
   * Get a valid API token from either Demo mode or Clerk
   * @returns Promise<string | null> - The token or null if not authenticated
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // 1. Check Demo mode first (takes priority)
    if (isDemoMode) {
      console.log('[useApiToken] Using Demo mode token');
      const demoToken = await getDemoToken();
      if (demoToken) {
        return demoToken;
      }
      console.warn('[useApiToken] Demo mode active but no token found');
    }

    // 2. Fall back to Clerk authentication
    if (clerkLoaded && isSignedIn) {
      console.log('[useApiToken] Using Clerk token');
      const clerkToken = await getClerkToken();
      return clerkToken;
    }

    console.log('[useApiToken] No authentication available');
    return null;
  }, [isDemoMode, getDemoToken, clerkLoaded, isSignedIn, getClerkToken]);

  /**
   * Check if the user is authenticated (either via Clerk or Demo mode)
   */
  const isAuthenticated = isDemoMode || (clerkLoaded && isSignedIn);

  /**
   * Check if auth state is ready
   */
  const isReady = isDemoMode || clerkLoaded;

  return {
    getToken,
    isAuthenticated,
    isReady,
    isDemoMode,
    isSignedIn,
  };
};

export default useApiToken;
