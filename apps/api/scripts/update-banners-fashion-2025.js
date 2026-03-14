import { pool } from '../src/config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateBanners() {
  console.log('\n=== Updating Banners to Fashion 2026 ===\n');
  
  try {
    const sqlPath = join(__dirname, '../../../database/update-banners-fashion-2025.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // First, delete existing homepage banners
    console.log('Deleting existing homepage banners...');
    await pool.execute('DELETE FROM banners WHERE position = ?', ['homepage']);
    console.log('✅ Old banners deleted\n');
    
    // Insert new Fashion 2026 banners
    console.log('Inserting Fashion 2026 banners...');
    const banners = [
      {
        title: 'Fashion 2026 Collection',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 1,
      },
      {
        title: 'New Season Arrivals',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 2,
      },
      {
        title: 'Designer Collection 2026',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 3,
      },
      {
        title: 'Street Style 2026',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 4,
      },
      {
        title: 'Luxury Fashion 2026',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 5,
      },
      {
        title: 'Sustainable Fashion 2026',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop',
        link: '/shop?category=clothing',
        sortOrder: 6,
      },
    ];
    
    for (const banner of banners) {
      await pool.execute(
        `INSERT INTO banners (title, image, link, position, isActive, sortOrder, createdAt, updatedAt) 
         VALUES (?, ?, ?, 'homepage', TRUE, ?, NOW(), NOW())`,
        [banner.title, banner.image, banner.link, banner.sortOrder]
      );
      console.log(`  ✅ Inserted: ${banner.title}`);
    }
    
    // Verify by selecting all banners
    const [result] = await pool.execute(
      `SELECT id, title, image, link, position, sortOrder, isActive 
       FROM banners 
       WHERE position = 'homepage' 
       ORDER BY sortOrder`
    );
    
    if (Array.isArray(result) && result.length > 0) {
      console.log(`\n✅ Total banners: ${result.length}`);
      result.forEach((banner, idx) => {
        console.log(`  ${idx + 1}. ${banner.title}`);
      });
    }
    
    console.log('\n✅ Banners updated successfully!\n');
    
  } catch (error) {
    console.error('❌ Error updating banners:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateBanners();

