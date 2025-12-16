import { pool } from '../src/config/database.js';

async function cleanupWishlist() {
  console.log('\n=== Cleaning up Wishlist from Database ===\n');
  
  try {
    // Drop wishlist_items table
    console.log('Dropping wishlist_items table...');
    await pool.execute('DROP TABLE IF EXISTS wishlist_items');
    console.log('✅ wishlist_items table dropped\n');
    
    // Verify
    const [tables] = await pool.execute(
      `SHOW TABLES LIKE 'wishlist%'`
    );
    
    if (tables.length === 0) {
      console.log('✅ Wishlist cleanup completed - no wishlist tables found\n');
    } else {
      console.log('⚠️  Warning: Some wishlist tables still exist:', tables);
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up wishlist:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupWishlist();

