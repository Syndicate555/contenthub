import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Item } from '../types';
import { storage } from '../utils/storage';

// Production backend URL
const API_BASE_URL = 'https://www.tavlo.ca';
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

// ==================== Types ====================

export interface AddContentPayload {
  url: string;
  note?: string;
}

export interface AddContentResponse {
  ok: boolean;
  data: Item;
  newBadges?: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export type ProcessingStep = 
  | 'idle'
  | 'validating'
  | 'fetching'
  | 'distilling'
  | 'tagging'
  | 'finalizing'
  | 'success'
  | 'error';

export interface ProcessingState {
  step: ProcessingStep;
  progress: number; // 0-100
  message: string;
}

// Step configuration for progress simulation
const PROCESSING_STEPS: { step: ProcessingStep; message: string; duration: number }[] = [
  { step: 'validating', message: 'Validating link...', duration: 800 },
  { step: 'fetching', message: 'Fetching content...', duration: 1500 },
  { step: 'distilling', message: 'AI distilling insights...', duration: 2500 },
  { step: 'tagging', message: 'Tagging & routing...', duration: 1500 },
  { step: 'finalizing', message: 'Finalizing...', duration: 1000 },
];

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

// ==================== useAddContent Hook ====================

export const useAddContent = () => {
  const { getToken: getClerkToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AddContentResponse | null>(null);
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

  /**
   * CRITICAL: Token priority order:
   * 1. If user is signed in with Clerk → ALWAYS use Clerk token (real user data)
   * 2. If user is NOT signed in AND demo mode is active → use demo token
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // PRIORITY 1: Clerk authenticated user - ALWAYS use Clerk token
    if (clerkLoaded && isSignedIn) {
      console.log('[useAddContent] User is signed in with Clerk - using Clerk token');
      return await getClerkToken();
    }
    
    // PRIORITY 2: Not signed in - check for demo mode
    const isDemoMode = await checkDemoModeFromStorage();
    if (isDemoMode) {
      console.log('[useAddContent] Not signed in, using Demo mode token');
      return await getDemoTokenFromStorage();
    }
    
    console.log('[useAddContent] No authentication available');
    return null;
  }, [getClerkToken, clerkLoaded, isSignedIn]);

  // Detect platform from URL
  const detectPlatform = useCallback((url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
    if (lowerUrl.includes('linkedin.com')) return 'linkedin';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('tiktok.com')) return 'tiktok';
    if (lowerUrl.includes('reddit.com')) return 'reddit';
    if (lowerUrl.includes('substack.com')) return 'newsletter';
    return 'web';
  }, []);

  // Simulate progress through steps
  const simulateProgress = useCallback(async (abortSignal: AbortSignal): Promise<void> => {
    let totalDuration = 0;
    const totalTime = PROCESSING_STEPS.reduce((sum, s) => sum + s.duration, 0);

    for (const stepConfig of PROCESSING_STEPS) {
      if (abortSignal.aborted) return;
      
      setProcessingState({
        step: stepConfig.step,
        progress: Math.round((totalDuration / totalTime) * 100),
        message: stepConfig.message,
      });

      // Animate progress within this step
      const startProgress = Math.round((totalDuration / totalTime) * 100);
      const endProgress = Math.round(((totalDuration + stepConfig.duration) / totalTime) * 100);
      const steps = 10;
      const stepDuration = stepConfig.duration / steps;

      for (let i = 0; i < steps; i++) {
        if (abortSignal.aborted) return;
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        const currentProgress = startProgress + ((endProgress - startProgress) * (i + 1) / steps);
        setProcessingState(prev => ({
          ...prev,
          progress: Math.round(currentProgress),
        }));
      }

      totalDuration += stepConfig.duration;
    }
  }, []);

  // Submit content
  const submitContent = useCallback(async (payload: AddContentPayload): Promise<AddContentResponse | null> => {
    // Check authentication
    const isClerkAuth = clerkLoaded && isSignedIn;
    const isDemoMode = !isClerkAuth && await checkDemoModeFromStorage();
    
    if (!isClerkAuth && !isDemoMode) {
      setError('Please sign in to add content');
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    // Create abort controller for progress simulation
    const abortController = new AbortController();

    try {
      console.log('[useAddContent] Submitting URL:', payload.url);
      
      // Start progress simulation in parallel with API call
      const progressPromise = simulateProgress(abortController.signal);

      // Get token using proper priority
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to retrieve session token');
      }

      // Make API request
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: payload.url,
          note: payload.note || undefined,
        }),
      });

      console.log('[useAddContent] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to save content (${response.status})`);
      }

      const data = await response.json();
      console.log('[useAddContent] Success! Item created:', data.data?.id);

      // Wait for progress animation to complete
      await progressPromise;

      // Set success state
      setProcessingState({
        step: 'success',
        progress: 100,
        message: 'Content saved successfully!',
      });

      const successResult: AddContentResponse = {
        ok: true,
        data: data.data,
        newBadges: data.newBadges,
      };
      setResult(successResult);

      return successResult;

    } catch (err: any) {
      // Abort progress simulation
      abortController.abort();
      
      console.error('[useAddContent] Error:', err.message);
      setError(err.message);
      setProcessingState({
        step: 'error',
        progress: 0,
        message: err.message,
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getToken, clerkLoaded, isSignedIn, simulateProgress]);

  // Reset state
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setProcessingState({
      step: 'idle',
      progress: 0,
      message: '',
    });
    setError(null);
    setResult(null);
  }, []);

  return {
    submitContent,
    reset,
    detectPlatform,
    isSubmitting,
    processingState,
    error,
    result,
    isReady,
  };
};
