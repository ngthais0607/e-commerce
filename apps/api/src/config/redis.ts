import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';
import { log } from '../utils/logger.js';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection.
 * Skip if REDIS_URL is empty or DISABLE_REDIS=1 (app runs without cache).
 * In development, fails fast to avoid connection retry spam when Redis is not running.
 */
export const initRedis = async (): Promise<RedisClientType | null> => {
  const redisUrl = (process.env.REDIS_URL || '').trim();
  const disableRedis = process.env.DISABLE_REDIS === '1' || process.env.DISABLE_REDIS === 'true';

  if (disableRedis || !redisUrl) {
    if (config.nodeEnv !== 'test') {
      log.info('Redis disabled (REDIS_URL empty or DISABLE_REDIS=1). Running without cache.');
    }
    return null;
  }

  const isDev = config.nodeEnv !== 'production';
  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries: number) => {
        if (isDev && retries > 0) {
          return new Error('Redis connection failed');
        }
        if (retries > 10) {
          log.error('Redis reconnection failed after 10 attempts', null);
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  }) as RedisClientType;

  let errorLogged = false;
  client.on('error', (err: Error) => {
    if (!errorLogged) {
      errorLogged = true;
      log.error('Redis Client Error', err);
    }
  });

  client.on('connect', () => {
    log.info('Redis client connecting...');
  });

  client.on('ready', () => {
    log.info('Redis client ready');
  });

  client.on('reconnecting', () => {
    if (!isDev) log.warn('Redis client reconnecting...');
  });

  try {
    await client.connect();
    log.info('Redis connected successfully');
    redisClient = client;
    return redisClient;
  } catch (error) {
    log.error('Failed to connect to Redis', error as Error);
    try {
      await client.quit();
    } catch {
      // ignore
    }
    redisClient = null;
    if (config.nodeEnv === 'production') {
      throw error;
    }
    return null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Ping Redis for health check (no log, fast)
 */
export const pingRedis = async (): Promise<boolean> => {
  if (!redisClient) return false;
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      log.info('Redis connection closed');
    } finally {
      redisClient = null;
    }
  }
};

export default redisClient;

