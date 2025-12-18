import { pool } from '../src/config/database.js';

async function fixCategoryName() {
  console.log('\n=== Fixing Category Name ===\n');
  
  try {
    // Check current category
    const [categories] = await pool.execute(
      'SELECT id, name, slug FROM categories WHERE id = 2'
    );
    
    if (categories.length > 0) {
      const category = categories[0];
      console.log('Current category:', category);
      
      // Update if needed
      if (category.name === 'General' || !category.name) {
        await pool.execute(
          `UPDATE categories 
           SET name = 'Clothing', 
               slug = 'clothing',
               updatedAt = NOW()
           WHERE id = 2`
        );
        console.log('✅ Category name updated to "Clothing"\n');
      } else {
        console.log(`✅ Category name is already "${category.name}"\n`);
      }
    } else {
      console.log('⚠️  Category with id 2 not found\n');
    }
    
    // Verify
    const [updated] = await pool.execute(
      'SELECT id, name, slug FROM categories WHERE id = 2'
    );
    console.log('Updated category:', updated[0]);
    
  } catch (error) {
    console.error('❌ Error fixing category name:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCategoryName();

