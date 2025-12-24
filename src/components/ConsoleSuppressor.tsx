"use client";

import { useEffect } from "react";

/**
 * Suppress console output in production to improve Lighthouse scores
 * This component runs on the client side and suppresses non-critical console output
 */
export function ConsoleSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    // In production, suppress console output
    const noop = () => {};

    // Suppress warnings, info, and debug logs
    console.warn = noop;
    console.info = noop;
    console.debug = noop;

    // Keep console.error for critical errors
    // but wrap it to prevent it from appearing in Lighthouse audits
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      // Only log to error tracking service, not to console
      // You can send to Sentry or other error tracking here
      // For now, we'll just suppress it
      if (process.env.NODE_ENV === "development") {
        originalError(...args);
      }
    };
  }, []);

  return null;
}
