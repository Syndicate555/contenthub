/**
 * Simple in-memory cache with TTL support
 * Used to cache frequently accessed database queries on the server
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();

    // Run cleanup every 60 seconds to remove expired entries
    if (typeof window === "undefined") {
      this.startCleanup();
    }
  }

  /**
   * Get a value from cache
   * Returns null if key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL (time-to-live) in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (e.g., "user:123:*")
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Wrap a function with caching
   * Automatically caches the result and returns cached value on subsequent calls
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Run every 60 seconds
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cache = new InMemoryCache();

/**
 * Cache key builders for consistent naming
 */
export const cacheKeys = {
  userStats: (userId: string) => `user:${userId}:stats`,
  userBadges: (userId: string) => `user:${userId}:badges`,
  allBadges: () => "badges:all",
  domains: () => "domains:all",
  userDomainStats: (userId: string) => `user:${userId}:domain-stats`,
  userFocusAreas: (userId: string) => `user:${userId}:focus-areas`,
  profileData: (userId: string) => `user:${userId}:profile`,
  settingsData: (userId: string) => `user:${userId}:settings`,
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  user: (userId: string) => {
    cache.deletePattern(`user:${userId}:*`);
  },
  badges: () => {
    cache.delete(cacheKeys.allBadges());
    cache.deletePattern("user:*:badges");
    cache.deletePattern("user:*:profile");
  },
  domains: () => {
    cache.delete(cacheKeys.domains());
    cache.deletePattern("user:*:focus-areas");
    cache.deletePattern("user:*:settings");
  },
};
