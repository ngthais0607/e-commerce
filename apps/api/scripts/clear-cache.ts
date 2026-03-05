import dotenv from 'dotenv';
import { initRedis, closeRedis } from '../src/config/redis.js';
import { deleteCachePattern, CACHE_KEYS } from '../src/utils/cache.js';
import { log } from '../src/utils/logger.js';

dotenv.config();

/**
 * Script to clear product cache (standalone - initializes Redis then clears cache)
 */
async function clearCache(): Promise<void> {
  console.log('\n=== Clearing Product Cache ===\n');

  try {
    await initRedis();
  } catch (err) {
    console.error('❌ Could not connect to Redis. Is REDIS_URL set and Redis running?', err);
    process.exit(1);
  }

  try {
    const deleted = await deleteCachePattern(`${CACHE_KEYS.PRODUCTS}:*`);
    console.log(`✅ Cleared ${deleted} cache entries\n`);

    const deleted2 = await deleteCachePattern(`${CACHE_KEYS.PRODUCT}:*`);
    console.log(`✅ Cleared ${deleted2} individual product cache entries\n`);

    console.log('✅ Cache cleared successfully!\n');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    log.error('Error clearing cache', error as Error);
    process.exit(1);
  } finally {
    await closeRedis();
  }

  process.exit(0);
}

clearCache();
