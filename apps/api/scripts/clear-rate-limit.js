import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

async function clearRateLimit() {
  let client;
  try {
    // Try to connect to Redis if available
    if (process.env.REDIS_URL) {
      client = createClient({ url: process.env.REDIS_URL });
      await client.connect();
      console.log('✅ Connected to Redis');
      
      // Clear rate limit keys
      const keys = await client.keys('*rate-limit*');
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`✅ Cleared ${keys.length} rate limit keys`);
      } else {
        console.log('ℹ️  No rate limit keys found');
      }
      
      await client.quit();
    } else {
      console.log('ℹ️  Redis not configured - rate limits are stored in memory');
      console.log('   Restart the API server to clear rate limits');
    }
    
    console.log('\n✅ Rate limit cleared!');
    console.log('   Please restart your API server:');
    console.log('   cd apps/api && npm run dev');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('ℹ️  Redis not running - rate limits are stored in memory');
      console.log('   Restart the API server to clear rate limits');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

clearRateLimit();

