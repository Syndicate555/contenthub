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
          await fetch("/api/session/terminate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "timeout" }),
          });
        } catch (error) {
          console.error(
            "[SessionProvider] Failed to terminate session:",
            error,
          );
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
          await fetch("/api/session/token-refresh", {
            method: "POST",
          });
        } catch (error) {
          console.error("[SessionProvider] Token refresh failed:", error);
          // Continue session even if token refresh fails (graceful degradation)
        }
      },

      onActivityUpdate: async (timestamp: number, type: ActivityType) => {
        try {
          await fetch("/api/session/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp, type }),
          });
        } catch (error) {
          console.error("[SessionProvider] Activity update failed:", error);
          // Continue session even if activity update fails
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
      await fetch("/api/session/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "logout" }),
      });
    } catch (error) {
      console.error("[SessionProvider] Failed to terminate session:", error);
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
