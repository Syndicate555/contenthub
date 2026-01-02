import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://www.tavlo.ca';
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_EXPIRES_KEY = 'tavlo_demo_expires';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

interface DemoUser {
  id: string;
  email: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoToken: string | null;
  demoUser: DemoUser | null;
  isLoading: boolean;
  error: string | null;
  startDemoSession: () => Promise<boolean>;
  endDemoSession: () => Promise<void>;
  getDemoToken: () => Promise<string | null>;
  checkDemoMode: () => Promise<boolean>;
}

const DemoContext = createContext<DemoContextType | null>(null);

export const useDemoMode = () => {
  const context = useContext(DemoContext);
  if (!context) {
    // Return a safe default instead of throwing - this allows the hook to be used
    // in components that might render before the provider is ready
    console.warn('[useDemoMode] Used outside DemoProvider, returning defaults');
    return {
      isDemoMode: false,
      demoToken: null,
      demoUser: null,
      isLoading: false,
      error: null,
      startDemoSession: async () => false,
      endDemoSession: async () => {},
      getDemoToken: async () => null,
      checkDemoMode: async () => false,
    };
  }
  return context;
};

interface DemoProviderProps {
  children: React.ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing demo session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('[DemoProvider] Checking for existing demo session...');
      const isDemoModeStored = await SecureStore.getItemAsync(DEMO_MODE_KEY);
      const storedToken = await SecureStore.getItemAsync(DEMO_TOKEN_KEY);
      const storedExpires = await SecureStore.getItemAsync(DEMO_EXPIRES_KEY);

      console.log('[DemoProvider] isDemoModeStored:', isDemoModeStored);
      console.log('[DemoProvider] hasToken:', !!storedToken);

      if (isDemoModeStored === 'true' && storedToken) {
        // Check expiration if available
        if (storedExpires) {
          const expiresAt = new Date(storedExpires);
          if (expiresAt <= new Date()) {
            console.log('[DemoProvider] Demo session expired, clearing...');
            await clearDemoStorage();
            return;
          }
        }
        
        // Token is valid
        console.log('[DemoProvider] Restored existing demo session');
        setDemoToken(storedToken);
        setIsDemoMode(true);
      }
    } catch (err) {
      console.error('[DemoProvider] Error checking existing session:', err);
    }
  };

  const clearDemoStorage = async () => {
    try {
      await SecureStore.deleteItemAsync(DEMO_TOKEN_KEY);
      await SecureStore.deleteItemAsync(DEMO_EXPIRES_KEY);
      await SecureStore.deleteItemAsync(DEMO_MODE_KEY);
    } catch (err) {
      console.error('[DemoProvider] Error clearing storage:', err);
    }
  };

  // Check if demo mode is active (can be called from anywhere)
  const checkDemoMode = useCallback(async (): Promise<boolean> => {
    try {
      const isDemoModeStored = await SecureStore.getItemAsync(DEMO_MODE_KEY);
      const storedToken = await SecureStore.getItemAsync(DEMO_TOKEN_KEY);
      return isDemoModeStored === 'true' && !!storedToken;
    } catch {
      return false;
    }
  }, []);

  // Start a new demo session
  const startDemoSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[DemoProvider] Starting demo session...');
      
      const response = await fetch(`${API_BASE_URL}/api/demo/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('[DemoProvider] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to start demo session (${response.status})`);
      }

      const data = await response.json();
      console.log('[DemoProvider] Session created successfully');

      if (!data.ok || !data.token) {
        throw new Error('Invalid response from demo server');
      }

      // Store token securely
      await SecureStore.setItemAsync(DEMO_TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(DEMO_MODE_KEY, 'true');
      if (data.expiresAt) {
        await SecureStore.setItemAsync(DEMO_EXPIRES_KEY, data.expiresAt);
      }

      // Update state
      setDemoToken(data.token);
      setDemoUser(data.user || null);
      setIsDemoMode(true);

      return true;
    } catch (err: any) {
      console.error('[DemoProvider] Error starting session:', err.message);
      setError(err.message || 'Unable to connect to demo server. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // End demo session
  const endDemoSession = useCallback(async () => {
    console.log('[DemoProvider] Ending demo session');
    await clearDemoStorage();
    setDemoToken(null);
    setDemoUser(null);
    setIsDemoMode(false);
    setError(null);
  }, []);

  // Get demo token (for API calls)
  const getDemoToken = useCallback(async (): Promise<string | null> => {
    // First check state
    if (demoToken) {
      return demoToken;
    }

    // Then check secure storage
    try {
      const storedToken = await SecureStore.getItemAsync(DEMO_TOKEN_KEY);
      const isDemoModeStored = await SecureStore.getItemAsync(DEMO_MODE_KEY);

      if (isDemoModeStored === 'true' && storedToken) {
        setDemoToken(storedToken);
        setIsDemoMode(true);
        return storedToken;
      }
    } catch (err) {
      console.error('[DemoProvider] Error getting token:', err);
    }

    return null;
  }, [demoToken]);

  const value: DemoContextType = {
    isDemoMode,
    demoToken,
    demoUser,
    isLoading,
    error,
    startDemoSession,
    endDemoSession,
    getDemoToken,
    checkDemoMode,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export default DemoProvider;
