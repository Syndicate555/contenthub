/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import {
  SessionActivityTracker,
  TOKEN_REFRESH_INTERVAL_MS,
  type SessionActivityCallbacks,
} from "./session-activity";

describe("SessionActivityTracker", () => {
  let callbacks: SessionActivityCallbacks;
  let tracker: SessionActivityTracker | null = null;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock document.hidden
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });

    callbacks = {
      onWarning: vi.fn(),
      onTimeout: vi.fn(),
      onTokenRefresh: vi.fn().mockResolvedValue(undefined),
      onActivityUpdate: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
      tracker = null;
    }
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("tab visibility handling", () => {
    test("starts token refresh when tab is initially visible", () => {
      tracker = new SessionActivityTracker(callbacks);

      // Fast-forward to first token refresh
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);

      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("does not start token refresh when tab is initially hidden", () => {
      // Mock document.hidden as true
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });

      tracker = new SessionActivityTracker(callbacks);

      // Fast-forward to first token refresh interval
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);

      expect(callbacks.onTokenRefresh).not.toHaveBeenCalled();
    });

    test("pauses token refresh when tab becomes hidden", () => {
      tracker = new SessionActivityTracker(callbacks);

      // First refresh should happen
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);

      // Simulate tab becoming hidden
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      // Second refresh should NOT happen because tab is hidden
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("resumes token refresh when tab becomes visible again", () => {
      // Start with hidden tab
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });

      tracker = new SessionActivityTracker(callbacks);

      // No refresh while hidden
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).not.toHaveBeenCalled();

      // Tab becomes visible
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      // Now refresh should happen
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("records activity when tab becomes visible", () => {
      // Start with hidden tab
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });

      tracker = new SessionActivityTracker(callbacks);

      // Tab becomes visible
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      // Activity should be recorded (debounced)
      vi.advanceTimersByTime(5000);
      expect(callbacks.onActivityUpdate).toHaveBeenCalled();
    });
  });

  describe("session expiration handling", () => {
    test("stops token refresh when session is marked as expired", () => {
      tracker = new SessionActivityTracker(callbacks);

      // First refresh happens
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);

      // Mark session as expired
      tracker.markSessionExpired();

      // Second refresh should NOT happen
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("does not resume token refresh after session expires even if tab becomes visible", () => {
      tracker = new SessionActivityTracker(callbacks);

      // Mark session as expired
      tracker.markSessionExpired();

      // Tab becomes hidden then visible
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      // No refresh should happen
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).not.toHaveBeenCalled();
    });
  });

  describe("token refresh behavior", () => {
    test("does not refresh when timeout is reached", () => {
      tracker = new SessionActivityTracker(callbacks);

      // Simulate timeout
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Clear the onTimeout call
      vi.clearAllMocks();

      // Try to refresh - should not happen
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).not.toHaveBeenCalled();
    });

    test("refreshes token at regular intervals when tab is visible and active", () => {
      tracker = new SessionActivityTracker(callbacks);

      // First refresh
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(1);

      // Second refresh
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(2);

      // Third refresh
      vi.advanceTimersByTime(TOKEN_REFRESH_INTERVAL_MS);
      expect(callbacks.onTokenRefresh).toHaveBeenCalledTimes(3);
    });
  });
});
