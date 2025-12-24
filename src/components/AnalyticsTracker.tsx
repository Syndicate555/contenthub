"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

interface AnalyticsTrackerProps {
  page: string;
}

/**
 * Client component to handle analytics tracking
 * Isolated to keep parent page as server component
 */
export function AnalyticsTracker({ page }: AnalyticsTrackerProps) {
  useEffect(() => {
    trackPageView(page);
  }, [page]);

  return null; // This component doesn't render anything
}
