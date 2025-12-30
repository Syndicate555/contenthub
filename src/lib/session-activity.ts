/**
 * Client-side session activity tracker for auto-logout and token rotation
 * Tracks user activity (mouse, keyboard, scroll, visibility) and triggers callbacks
 */

// Constants from plan
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const WARNING_THRESHOLD_MS = 28 * 60 * 1000; // 28 minutes
export const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_UPDATE_DEBOUNCE_MS = 5 * 1000; // 5 seconds (batch updates)
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export type ActivityType = "click" | "scroll" | "api_call" | "refresh";

export type SessionActivityCallbacks = {
  onWarning: () => void; // Called at 28 minutes
  onTimeout: () => void; // Called at 30 minutes
  onTokenRefresh: () => Promise<void>; // Called every 5 minutes during activity
  onActivityUpdate: (timestamp: number, type: ActivityType) => Promise<void>; // Called to record activity
};

/**
 * SessionActivityTracker - Tracks user activity and manages session lifecycle
 */
export class SessionActivityTracker {
  private lastActivityTimestamp: number;
  private warningShown = false;
  private timeoutReached = false;
  private warningTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private activityUpdateTimer: NodeJS.Timeout | null = null;
  private pendingActivityType: ActivityType | null = null;
  private callbacks: SessionActivityCallbacks;
  private eventListeners: Array<{
    element: Window | Document;
    event: string;
    handler: EventListener;
  }> = [];
  private isTabVisible = true;
  private sessionExpired = false;

  constructor(callbacks: SessionActivityCallbacks) {
    this.callbacks = callbacks;
    this.lastActivityTimestamp = Date.now();
    this.start();
  }

  /**
   * Start tracking activity
   */
  private start(): void {
    // Initialize tab visibility state
    this.isTabVisible = !document.hidden;

    // Register activity event listeners
    ACTIVITY_EVENTS.forEach((eventType) => {
      const handler = this.handleActivity.bind(this);
      const element = eventType === "scroll" ? window : document;
      element.addEventListener(eventType, handler, { passive: true });
      this.eventListeners.push({ element, event: eventType, handler });
    });

    // Listen for visibility changes (tab switching)
    const visibilityHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener("visibilitychange", visibilityHandler);
    this.eventListeners.push({
      element: document,
      event: "visibilitychange",
      handler: visibilityHandler,
    });

    // Start timers
    this.resetTimers();

    // Only start token refresh if tab is currently visible
    if (this.isTabVisible) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Handle user activity events
   */
  private handleActivity(event: Event): void {
    if (this.timeoutReached) return; // Already timed out, ignore activity

    const activityType: ActivityType =
      event.type === "scroll" ? "scroll" : "click";
    this.recordActivity(activityType);
  }

  /**
   * Handle visibility change (tab switching)
   */
  private handleVisibilityChange(): void {
    const wasHidden = !this.isTabVisible;
    this.isTabVisible = !document.hidden;

    if (this.isTabVisible && !this.timeoutReached) {
      // Tab became visible
      if (wasHidden) {
        // Resume token refresh when tab becomes visible again
        this.resumeTokenRefresh();
        // Treat as activity
        this.recordActivity("click");
      }
    } else if (!this.isTabVisible) {
      // Tab became hidden - pause token refresh to avoid browser throttling
      this.pauseTokenRefresh();
    }
  }

  /**
   * Record activity and reset timers
   */
  private recordActivity(type: ActivityType): void {
    this.lastActivityTimestamp = Date.now();
    this.warningShown = false;
    this.pendingActivityType = type;

    // Reset warning/timeout timers
    this.resetTimers();

    // Debounce activity updates to server (batch every 5 seconds)
    if (this.activityUpdateTimer) {
      clearTimeout(this.activityUpdateTimer);
    }

    this.activityUpdateTimer = setTimeout(() => {
      if (this.pendingActivityType) {
        void this.callbacks.onActivityUpdate(
          this.lastActivityTimestamp,
          this.pendingActivityType,
        );
        this.pendingActivityType = null;
      }
    }, ACTIVITY_UPDATE_DEBOUNCE_MS);
  }

  /**
   * Manually record activity (for API calls, etc.)
   */
  public recordManualActivity(type: ActivityType): void {
    this.recordActivity(type);
  }

  /**
   * Reset warning and timeout timers
   */
  private resetTimers(): void {
    // Clear existing timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);

    // Schedule warning at 28 minutes
    this.warningTimer = setTimeout(() => {
      if (!this.warningShown && !this.timeoutReached) {
        this.warningShown = true;
        this.callbacks.onWarning();
      }
    }, WARNING_THRESHOLD_MS);

    // Schedule timeout at 30 minutes
    this.timeoutTimer = setTimeout(() => {
      if (!this.timeoutReached) {
        this.timeoutReached = true;
        this.callbacks.onTimeout();
        this.cleanup();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Schedule token refresh every 5 minutes during activity
   */
  private scheduleTokenRefresh(): void {
    this.tokenRefreshTimer = setInterval(() => {
      // Only refresh if tab is visible, session hasn't expired, and timeout not reached
      if (!this.timeoutReached && !this.sessionExpired && this.isTabVisible) {
        void this.callbacks.onTokenRefresh();
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
  }

  /**
   * Pause token refresh (when tab is hidden)
   */
  private pauseTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Resume token refresh (when tab becomes visible)
   */
  private resumeTokenRefresh(): void {
    if (!this.tokenRefreshTimer && !this.sessionExpired) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Mark session as expired (stop all refresh attempts)
   */
  public markSessionExpired(): void {
    this.sessionExpired = true;
    this.pauseTokenRefresh();
  }

  /**
   * Extend session (called when user clicks "Stay Signed In")
   */
  public extendSession(): void {
    this.recordActivity("click");
    this.warningShown = false;
  }

  /**
   * Get time remaining until warning (in milliseconds)
   */
  public getTimeUntilWarning(): number {
    const elapsed = Date.now() - this.lastActivityTimestamp;
    return Math.max(0, WARNING_THRESHOLD_MS - elapsed);
  }

  /**
   * Get time remaining until timeout (in milliseconds)
   */
  public getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivityTimestamp;
    return Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
  }

  /**
   * Cleanup timers and event listeners
   */
  public cleanup(): void {
    // Clear timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.tokenRefreshTimer) clearInterval(this.tokenRefreshTimer);
    if (this.activityUpdateTimer) clearTimeout(this.activityUpdateTimer);

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  /**
   * Destroy the tracker (cleanup all resources)
   */
  public destroy(): void {
    this.cleanup();
  }
}
