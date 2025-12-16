import { deleteCachePattern, CACHE_KEYS } from '../src/utils/cache.js';
import { log } from '../src/utils/logger.js';

/**
 * Script to clear product cache
 */
async function clearCache() {
  console.log('\n=== Clearing Product Cache ===\n');
  
  try {
    // Clear all product-related cache
    const deleted = await deleteCachePattern(`${CACHE_KEYS.PRODUCTS}:*`);
    console.log(`✅ Cleared ${deleted} cache entries\n`);
    
    // Also clear individual product cache
    const deleted2 = await deleteCachePattern(`${CACHE_KEYS.PRODUCT}:*`);
    console.log(`✅ Cleared ${deleted2} individual product cache entries\n`);
    
    console.log('✅ Cache cleared successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    log.error('Error clearing cache', error);
    process.exit(1);
  }
}

clearCache();

