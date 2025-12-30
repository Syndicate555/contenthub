"use client";

/**
 * SessionProvider - Manages session activity tracking and auto-logout
 * Tracks user activity, shows warning modal, handles auto-logout and token rotation
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  SessionActivityTracker,
  type ActivityType,
} from "@/lib/session-activity";
import { InactivityWarningModal } from "@/components/modals/inactivity-warning-modal";

/**
 * Fetch with timeout and abort controller
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const trackerRef = useRef<SessionActivityTracker | null>(null);

  useEffect(() => {
    // Only initialize tracker if user is signed in
    if (!isSignedIn) {
      return;
    }

    // Initialize activity tracker
    const tracker = new SessionActivityTracker({
      onWarning: () => {
        setShowWarning(true);
      },

      onTimeout: async () => {
        // Terminate session on backend
        try {
          await fetchWithTimeout(
            "/api/session/terminate",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason: "timeout" }),
            },
            5000,
          );
        } catch (error) {
          // Log but continue with sign out even if termination fails
          console.warn("[SessionProvider] Failed to terminate session:", error);
        }

        // Sign out from Clerk
        await signOut();

        // Redirect to sign-in with timeout reason
        router.push("/sign-in?reason=timeout");
      },

      onTokenRefresh: async () => {
        try {
          // Refresh Clerk token
          await user?.reload();

          // Update backend token rotation tracking
          const response = await fetchWithTimeout(
            "/api/session/token-refresh",
            {
              method: "POST",
            },
            10000,
          );

          if (!response.ok) {
            // Session expired or unauthorized
            if (response.status === 401) {
              console.warn(
                "[SessionProvider] Session expired, stopping token refresh",
              );
              tracker.markSessionExpired();
              return;
            }

            // Other errors - log but don't spam console
            if (response.status >= 500) {
              console.warn(
                `[SessionProvider] Server error during token refresh: ${response.status}`,
              );
            }
          }
        } catch (error) {
          // Network errors, timeouts, etc. - log once and continue
          // This is expected when tab is backgrounded for a long time
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              console.warn(
                "[SessionProvider] Token refresh timed out (tab may be backgrounded)",
              );
            } else {
              console.warn(
                "[SessionProvider] Token refresh failed:",
                error.message,
              );
            }
          }
          // Continue session even if token refresh fails (graceful degradation)
        }
      },

      onActivityUpdate: async (timestamp: number, type: ActivityType) => {
        try {
          const response = await fetchWithTimeout(
            "/api/session/activity",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ timestamp, type }),
            },
            10000,
          );

          if (!response.ok && response.status === 401) {
            // Session expired
            tracker.markSessionExpired();
          }
        } catch {
          // Silently fail for activity updates - they're not critical
          // Network errors are expected when tab is backgrounded
        }
      },
    });

    trackerRef.current = tracker;

    // Cleanup on unmount
    return () => {
      tracker.destroy();
      trackerRef.current = null;
    };
  }, [isSignedIn, signOut, router, user]);

  const handleStaySignedIn = () => {
    setShowWarning(false);
    trackerRef.current?.extendSession();
  };

  const handleSignOut = async () => {
    // Terminate session on backend
    try {
      await fetchWithTimeout(
        "/api/session/terminate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "logout" }),
        },
        5000,
      );
    } catch (error) {
      // Log but continue with sign out even if termination fails
      console.warn("[SessionProvider] Failed to terminate session:", error);
    }

    // Sign out from Clerk
    await signOut();

    // Redirect to sign-in
    router.push("/sign-in");
  };

  return (
    <>
      {children}
      <InactivityWarningModal
        isOpen={showWarning}
        onStaySignedIn={handleStaySignedIn}
        onSignOut={handleSignOut}
      />
    </>
  );
}
