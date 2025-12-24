/**
 * Suppress console output in production to improve Lighthouse scores
 * This only runs on the client side and only in production
 */
export function suppressConsoleProd() {
  if (typeof window === "undefined") {
    // Server-side, don't suppress anything
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // Development mode, keep console output for debugging
    return;
  }

  // In production, suppress console output
  // We keep console.error for critical errors but suppress warnings
  const noop = () => {};

  console.warn = noop;
  console.info = noop;
  console.debug = noop;

  // Optionally, you can also suppress console.error
  // but it's better to keep it for critical errors that might be caught by error tracking
  // console.error = noop;
}
