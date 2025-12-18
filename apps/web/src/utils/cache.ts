/**
 * API response caching utilities
 * Provides in-memory caching for API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxSize: number = 100;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  /**
   * Generate cache key from URL and params
   */
  private generateKey(url: string, params?: Record<string, unknown>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * Get cached data
   */
  get<T>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(url: string, data: T, params?: Record<string, unknown>, ttl?: number): void {
    const key = this.generateKey(url, params);
    const now = Date.now();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  /**
   * Check if data exists in cache
   */
  has(url: string, params?: Record<string, unknown>): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cached data
   */
  delete(url: string, params?: Record<string, unknown>): boolean {
    const key = this.generateKey(url, params);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
    };
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }
}

// Singleton instance
export const apiCache = new ApiCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
});

/**
 * Auto-clean expired entries every minute
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 60 * 1000);
}

import React from 'react';

/**
 * React hook for cached API calls
 */
export function useCachedApi<T>(
  url: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; params?: Record<string, unknown> } = {}
) {
  const [data, setData] = React.useState<T | null>(() => {
    return apiCache.get<T>(url, options.params) || null;
  });
  const [loading, setLoading] = React.useState(!data);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Check cache first
    const cached = apiCache.get<T>(url, options.params);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Fetch if not cached
    setLoading(true);
    fetcher()
      .then((result) => {
        setData(result);
        apiCache.set(url, result, options.params, options.ttl);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
    // We intentionally only depend on URL + params stringified.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(options.params)]);

  return { data, loading, error };
}

