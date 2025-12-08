"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getBrowserTimezone, isValidTimezone } from "@/lib/timezone";

/**
 * Hook to auto-detect and sync user's timezone with the server
 * Runs once on mount and updates if timezone changes
 */
export function useTimezoneSync() {
  const { isLoaded, userId } = useAuth();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    // Only sync if user is authenticated
    if (!isLoaded || !userId) return;

    const syncTimezone = async () => {
      try {
        // Get browser timezone
        const browserTz = getBrowserTimezone();

        // Validate timezone
        if (!isValidTimezone(browserTz)) {
          console.warn("Invalid browser timezone detected:", browserTz);
          return;
        }

        // Check if timezone has changed since last sync
        const cachedTz = localStorage.getItem("user_timezone");

        if (cachedTz === browserTz) {
          // Timezone hasn't changed, no need to sync
          setIsSynced(true);
          return;
        }

        // Send timezone to server
        const response = await fetch("/api/user/timezone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timezone: browserTz }),
        });

        if (response.ok) {
          // Cache the synced timezone
          localStorage.setItem("user_timezone", browserTz);
          setIsSynced(true);
          console.log("Timezone synced:", browserTz);
        } else {
          console.error("Failed to sync timezone:", await response.text());
        }
      } catch (error) {
        console.error("Error syncing timezone:", error);
      }
    };

    syncTimezone();
  }, [isLoaded, userId]);

  return { isSynced };
}
