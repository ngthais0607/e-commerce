import { getRedisClient } from '../config/redis.js';
import { log } from './logger.js';

/**
 * Cache utility functions
 */

/**
 * Get value from cache
 */
export const getCache = async (key: string): Promise<any | null> => {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    log.error('Cache get error', error as Error, { key });
    return null;
  }
};

/**
 * Set value in cache
 */
export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    log.error('Cache set error', error as Error, { key });
    return false;
  }
};

/**
 * Delete value from cache
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    log.error('Cache delete error', error as Error, { key });
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<number> => {
  try {
    const client = getRedisClient();
    if (!client) return 0;

    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await client.del(keys);
    log.info(`Deleted ${deleted} cache keys matching pattern: ${pattern}`);
    return deleted;
  } catch (error) {
    log.error('Cache delete pattern error', error as Error, { pattern });
    return 0;
  }
};

/**
 * Cache wrapper for async functions
 */
export const cacheWrapper = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> => {
  // Try to get from cache
  const cached = await getCache(key);
  if (cached !== null) {
    log.debug('Cache hit', { key });
    return cached;
  }

  // Cache miss - execute function
  log.debug('Cache miss', { key });
  const result = await fn();
  
  // Store in cache
  await setCache(key, result, ttl);
  
  return result;
};

/**
 * Generate cache key
 */
export const generateCacheKey = (prefix: string, params: Record<string, any> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join(':');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

// Cache key prefixes
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
  CATEGORY: 'category',
  USER: 'user',
  ORDER: 'order',
  ORDERS: 'orders',
} as const;

