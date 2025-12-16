import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';
import { log } from '../utils/logger.js';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<RedisClientType | null> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            log.error('Redis reconnection failed after 10 attempts', null);
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err: Error) => {
      log.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      log.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      log.info('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      log.warn('Redis client reconnecting...');
    });

    await redisClient.connect();
    log.info('Redis connected successfully');
    
    return redisClient;
  } catch (error) {
    log.error('Failed to connect to Redis', error as Error);
    // Don't throw - allow app to run without Redis in development
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
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    log.info('Redis connection closed');
  }
};

export default redisClient;

