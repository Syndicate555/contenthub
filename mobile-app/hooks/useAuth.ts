import { useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { setAuthToken } from '../services/api';

/**
 * Custom hook that syncs Clerk authentication with our API service.
 * This hook should be used in the app layout to ensure the API token is always up to date.
 */
export function useAuthSync() {
  const { getToken, isSignedIn } = useClerkAuth();

  useEffect(() => {
    async function syncToken() {
      if (isSignedIn) {
        try {
          // Get the Clerk session token
          const token = await getToken();
          console.log('[Auth] Token synced:', token ? 'present' : 'missing');
          setAuthToken(token);
        } catch (error) {
          console.error('[Auth] Failed to get token:', error);
          setAuthToken(null);
        }
      } else {
        console.log('[Auth] User not signed in, clearing token');
        setAuthToken(null);
      }
    }

    syncToken();
  }, [isSignedIn, getToken]);

  return { isSignedIn };
}

/**
 * Hook to get a fresh token for API calls.
 * Use this when you need to ensure you have the latest token.
 */
export function useGetToken() {
  const { getToken } = useClerkAuth();
  
  return async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      return token;
    } catch (error) {
      console.error('[Auth] Failed to get token:', error);
      return null;
    }
  };
}
