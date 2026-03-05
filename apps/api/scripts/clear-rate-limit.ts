import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

async function clearRateLimit(): Promise<void> {
  let client: RedisClientType | undefined;
  try {
    if (process.env.REDIS_URL) {
      client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
      await client.connect();
      console.log('✅ Connected to Redis');

      const keys = await client.keys('*rate-limit*');
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`✅ Cleared ${keys.length} rate limit keys`);
      } else {
        console.log('ℹ️  No rate limit keys found');
      }
    } else {
      console.log('ℹ️  Redis not configured - rate limits are stored in memory');
      console.log('   Restart the API server to clear rate limits');
    }

    console.log('\n✅ Rate limit cleared!');
    console.log('   Please restart your API server:');
    console.log('   cd apps/api && npm run dev');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === 'ECONNREFUSED') {
      console.log('ℹ️  Redis not running - rate limits are stored in memory');
      console.log('   Restart the API server to clear rate limits');
    } else {
      console.error('❌ Error:', err?.message ?? error);
    }
  } finally {
    if (client) {
      try {
        await client.quit();
      } catch {
        // ignore
      }
    }
  }
}

clearRateLimit();
