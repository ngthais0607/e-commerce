import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../src/config/database.js';
import { log } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script to seed products data from SQL file
 */
async function seedProducts() {
  console.log('\n=== Seeding Products Data ===\n');
  
  try {
    // Read SQL file
    const sqlFilePath = join(__dirname, '../../../database/insert-products-with-images.sql');
    console.log('Reading SQL file:', sqlFilePath);
    
    const sqlContent = readFileSync(sqlFilePath, 'utf-8');
    
    // Split SQL file into individual statements
    // Remove comments and split by semicolons
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        stmt !== 'USE ecommerce'
      );
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        // Execute statement
        await pool.execute(statement);
        successCount++;
        
        // Show progress for INSERT statements
        if (statement.toUpperCase().includes('INSERT')) {
          const tableMatch = statement.match(/INSERT INTO (\w+)/i);
          const table = tableMatch ? tableMatch[1] : 'unknown';
          console.log(`✅ Inserted into ${table}`);
        }
      } catch (error) {
        errorCount++;
        // Some errors are expected (like duplicate keys), so we log but continue
        if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_DUP_KEY') {
          console.log(`⚠️  Duplicate entry (skipping): ${error.message.substring(0, 100)}`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Log the problematic statement for debugging
          if (statement.length < 200) {
            console.error('   Statement:', statement.substring(0, 200));
          }
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify data
    console.log('\n=== Verifying Data ===');
    
    const [categories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [banners] = await pool.execute('SELECT COUNT(*) as count FROM banners');
    
    console.log(`Categories: ${categories[0].count}`);
    console.log(`Products: ${products[0].count}`);
    console.log(`Banners: ${banners[0].count}`);
    
    // Show products by category
    const [categoryProducts] = await pool.execute(`
      SELECT 
        c.name as category,
        COUNT(p.id) as product_count,
        AVG(p.rating) as avg_rating
      FROM categories c
      LEFT JOIN products p ON c.id = p.categoryId
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    console.log('\nProducts by Category:');
    categoryProducts.forEach(row => {
      console.log(`  ${row.category}: ${row.product_count} products (avg rating: ${parseFloat(row.avg_rating || 0).toFixed(1)})`);
    });
    
    console.log('\n✅ Product seeding completed!\n');
    
  } catch (error) {
    console.error('❌ Fatal error seeding products:', error);
    log.error('Error seeding products', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedProducts();

