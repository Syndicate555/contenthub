"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and reports them to the console
 * In production, you can send these to an analytics service
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    }

    // In production, send to your analytics service
    // Example: sendToAnalytics(metric);
  });

  // Add performance observer for additional metrics
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    // Monitor Long Tasks (tasks that block the main thread for >50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Performance] Long Task detected:`, {
              duration: `${Math.round(entry.duration)}ms`,
              startTime: `${Math.round(entry.startTime)}ms`,
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });

      return () => longTaskObserver.disconnect();
    } catch (e) {
      // PerformanceObserver not supported or entryType not available
    }
  }, []);

  return null;
}

/**
 * Helper to send metrics to an analytics service
 * Replace with your analytics provider (Vercel Analytics, Google Analytics, etc.)
 */
function sendToAnalytics(metric: any) {
  // Example: Send to Vercel Analytics
  // window.va?.track(metric.name, { value: metric.value });
  // Example: Send to Google Analytics
  // window.gtag?.('event', metric.name, {
  //   value: Math.round(metric.value),
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   non_interaction: true,
  // });
  // Example: Send to custom endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // });
}
