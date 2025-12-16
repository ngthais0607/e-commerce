import { pool } from '../src/config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateProducts() {
  console.log('\n=== Updating Products to Clothing Only ===\n');
  
  try {
    const sqlPath = join(__dirname, '../../../database/update-products-clothing-only.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Get clothing category ID
    const [categories] = await pool.execute(
      `SELECT id FROM categories WHERE slug = 'clothing' OR name LIKE '%Clothing%' OR name LIKE '%Fashion%' LIMIT 1`
    );
    
    let clothingCategoryId;
    if (categories.length > 0) {
      clothingCategoryId = categories[0].id;
      console.log(`Found clothing category ID: ${clothingCategoryId}`);
    } else {
      // Create clothing category
      const [result] = await pool.execute(
        `INSERT INTO categories (name, slug, description, image, isActive)
         VALUES ('Fashion & Clothing', 'clothing', 'Fashion and apparel for all occasions', 
         'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', TRUE)`
      );
      clothingCategoryId = result.insertId;
      console.log(`Created clothing category with ID: ${clothingCategoryId}`);
    }
    
    // Set non-clothing products to inactive instead of deleting (to avoid foreign key issues)
    console.log('\nDeactivating non-clothing products...');
    const [deactivateResult] = await pool.execute(
      `UPDATE products SET isActive = FALSE WHERE categoryId != ?`,
      [clothingCategoryId]
    );
    console.log(`✅ Deactivated ${deactivateResult.affectedRows} non-clothing products`);
    
    // Delete existing clothing products (only if no orders reference them)
    console.log('Clearing existing clothing products...');
    try {
      // First, try to delete products that are not in any orders
      await pool.execute(
        `DELETE FROM products 
         WHERE categoryId = ? 
         AND id NOT IN (SELECT DISTINCT productId FROM order_items WHERE productId IS NOT NULL)`,
        [clothingCategoryId]
      );
      console.log('✅ Cleared existing clothing products (not in orders)');
    } catch (error) {
      // If that fails, just deactivate them
      await pool.execute(
        `UPDATE products SET isActive = FALSE WHERE categoryId = ?`,
        [clothingCategoryId]
      );
      console.log('✅ Deactivated existing clothing products\n');
    }
    
    // Insert new clothing products
    const clothingProducts = [
      {
        name: 'Elegant Summer Dress 2025',
        slug: 'elegant-summer-dress-2025',
        shortDesc: 'Stylish summer dress perfect for any occasion',
        description: 'Discover elegance with our 2025 summer dress collection. Made from premium breathable fabric, this dress features a modern silhouette that flatters every body type.',
        price: 89.99,
        salePrice: 69.99,
        stock: 45,
        sku: 'FASH-001',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          'https://images.unsplash.com/photo-1566479179817-4c3ee5b56a6a?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 89,
      },
      {
        name: 'Classic Denim Jacket',
        slug: 'classic-denim-jacket',
        shortDesc: 'Timeless denim jacket for every wardrobe',
        description: 'A wardrobe essential for 2025. This classic denim jacket combines comfort with style. Made from premium denim, it features a relaxed fit perfect for layering.',
        price: 79.99,
        salePrice: 59.99,
        stock: 60,
        sku: 'FASH-002',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 124,
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        shortDesc: 'Soft and comfortable cotton t-shirt',
        description: 'Essential basic t-shirt made from 100% organic cotton. Soft, breathable, and perfect for everyday wear. Available in multiple colors.',
        price: 29.99,
        salePrice: 24.99,
        stock: 100,
        sku: 'FASH-003',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.4,
        reviewCount: 156,
      },
      {
        name: 'Designer Blazer 2025',
        slug: 'designer-blazer-2025',
        shortDesc: 'Professional blazer for modern women',
        description: 'Elevate your professional wardrobe with this designer blazer. Tailored fit, premium fabric, and timeless design.',
        price: 149.99,
        salePrice: 119.99,
        stock: 35,
        sku: 'FASH-004',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.7,
        reviewCount: 78,
      },
      {
        name: 'Casual Wide Leg Pants',
        slug: 'casual-wide-leg-pants',
        shortDesc: 'Comfortable and stylish wide leg pants',
        description: 'Trendy wide leg pants perfect for 2025 fashion. Comfortable fit with a modern silhouette. Made from high-quality fabric.',
        price: 69.99,
        salePrice: 54.99,
        stock: 50,
        sku: 'FASH-005',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 92,
      },
      {
        name: 'Classic White Dress Shirt',
        slug: 'classic-white-dress-shirt',
        shortDesc: 'Professional dress shirt for men',
        description: 'Crisp white dress shirt perfect for business or formal occasions. Premium cotton fabric, classic fit, and impeccable tailoring.',
        price: 59.99,
        salePrice: 49.99,
        stock: 70,
        sku: 'FASH-006',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
          'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 112,
      },
      {
        name: 'Slim Fit Chinos',
        slug: 'slim-fit-chinos',
        shortDesc: 'Versatile chinos for everyday wear',
        description: 'Modern slim fit chinos in classic colors. Perfect for both casual and smart casual looks. Comfortable fabric with stretch.',
        price: 64.99,
        salePrice: 49.99,
        stock: 65,
        sku: 'FASH-007',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 98,
      },
      {
        name: 'Hooded Sweatshirt',
        slug: 'hooded-sweatshirt',
        shortDesc: 'Comfortable hooded sweatshirt',
        description: 'Cozy and stylish hooded sweatshirt perfect for casual wear. Soft fabric, comfortable fit, and modern design.',
        price: 54.99,
        salePrice: 44.99,
        stock: 80,
        sku: 'FASH-008',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.4,
        reviewCount: 134,
      },
      {
        name: 'Leather Jacket',
        slug: 'leather-jacket',
        shortDesc: 'Classic leather jacket',
        description: 'Timeless leather jacket with modern details. Premium genuine leather, perfect fit, and classic design.',
        price: 199.99,
        salePrice: 159.99,
        stock: 25,
        sku: 'FASH-009',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
          'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.8,
        reviewCount: 67,
      },
      {
        name: 'Casual Polo Shirt',
        slug: 'casual-polo-shirt',
        shortDesc: 'Versatile polo shirt',
        description: 'Classic polo shirt in premium cotton. Perfect for casual Fridays, weekend outings, or smart casual events.',
        price: 39.99,
        salePrice: 34.99,
        stock: 90,
        sku: 'FASH-010',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 145,
      },
      {
        name: 'Oversized Hoodie',
        slug: 'oversized-hoodie',
        shortDesc: 'Comfortable oversized hoodie',
        description: 'Trendy oversized hoodie perfect for 2025 street style. Soft fabric, relaxed fit, and modern design.',
        price: 49.99,
        salePrice: 39.99,
        stock: 75,
        sku: 'FASH-011',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 178,
      },
      {
        name: 'High-Waisted Jeans',
        slug: 'high-waisted-jeans',
        shortDesc: 'Stylish high-waisted jeans',
        description: 'Modern high-waisted jeans with perfect fit. Flattering silhouette, premium denim, and comfortable stretch.',
        price: 89.99,
        salePrice: 74.99,
        stock: 55,
        sku: 'FASH-012',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.7,
        reviewCount: 203,
      },
      {
        name: 'Crop Top',
        slug: 'crop-top',
        shortDesc: 'Trendy crop top',
        description: 'Fashion-forward crop top perfect for 2025. Comfortable fabric, flattering fit, and versatile styling options.',
        price: 34.99,
        salePrice: 29.99,
        stock: 85,
        sku: 'FASH-013',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 167,
      },
      {
        name: 'Midi Skirt',
        slug: 'midi-skirt',
        shortDesc: 'Elegant midi skirt',
        description: 'Chic midi skirt perfect for office or casual wear. Flowing fabric, flattering length, and timeless design.',
        price: 59.99,
        salePrice: 49.99,
        stock: 40,
        sku: 'FASH-014',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          'https://images.unsplash.com/photo-1566479179817-4c3ee5b56a6a?w=800',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 94,
      },
      {
        name: 'Trench Coat',
        slug: 'trench-coat',
        shortDesc: 'Classic trench coat',
        description: 'Timeless trench coat for all seasons. Water-resistant fabric, classic design, and perfect fit.',
        price: 179.99,
        salePrice: 149.99,
        stock: 30,
        sku: 'FASH-015',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.8,
        reviewCount: 56,
      },
      {
        name: 'Athletic Leggings',
        slug: 'athletic-leggings',
        shortDesc: 'Comfortable athletic leggings',
        description: 'High-performance leggings perfect for workouts or casual wear. Moisture-wicking fabric, comfortable fit.',
        price: 44.99,
        salePrice: 39.99,
        stock: 95,
        sku: 'FASH-016',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544966503-7cc75a1e7b08?w=800',
          'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 189,
      },
      {
        name: 'Knit Sweater',
        slug: 'knit-sweater',
        shortDesc: 'Cozy knit sweater',
        description: 'Warm and cozy knit sweater perfect for cooler weather. Soft fabric, comfortable fit, and classic design.',
        price: 74.99,
        salePrice: 64.99,
        stock: 60,
        sku: 'FASH-017',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800',
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 142,
      },
      {
        name: 'Cargo Pants',
        slug: 'cargo-pants',
        shortDesc: 'Functional cargo pants',
        description: 'Stylish cargo pants with multiple pockets. Comfortable fit, durable fabric, and modern design.',
        price: 79.99,
        salePrice: 69.99,
        stock: 45,
        sku: 'FASH-018',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 118,
      },
      {
        name: 'Silk Blouse',
        slug: 'silk-blouse',
        shortDesc: 'Luxurious silk blouse',
        description: 'Elegant silk blouse perfect for special occasions. Premium fabric, flattering fit, and sophisticated design.',
        price: 119.99,
        salePrice: 99.99,
        stock: 35,
        sku: 'FASH-019',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.7,
        reviewCount: 76,
      },
      {
        name: 'Bomber Jacket',
        slug: 'bomber-jacket',
        shortDesc: 'Stylish bomber jacket',
        description: 'Trendy bomber jacket perfect for 2025 street style. Lightweight fabric, comfortable fit, and modern design.',
        price: 94.99,
        salePrice: 79.99,
        stock: 50,
        sku: 'FASH-020',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 103,
      },
      {
        name: 'Maxi Dress 2025',
        slug: 'maxi-dress-2025',
        shortDesc: 'Elegant maxi dress for any occasion',
        description: 'Beautiful flowing maxi dress perfect for summer 2025. Lightweight fabric, flattering silhouette, and versatile styling.',
        price: 99.99,
        salePrice: 79.99,
        stock: 55,
        sku: 'FASH-021',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          'https://images.unsplash.com/photo-1566479179817-4c3ee5b56a6a?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.7,
        reviewCount: 156,
      },
      {
        name: 'Tailored Suit Pants',
        slug: 'tailored-suit-pants',
        shortDesc: 'Professional tailored pants',
        description: 'Classic tailored suit pants for the modern professional. Premium fabric, perfect fit, and timeless design.',
        price: 139.99,
        salePrice: 119.99,
        stock: 42,
        sku: 'FASH-022',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.8,
        reviewCount: 98,
      },
      {
        name: 'Oversized Denim Shirt',
        slug: 'oversized-denim-shirt',
        shortDesc: 'Comfortable oversized denim shirt',
        description: 'Trendy oversized denim shirt perfect for layering. Versatile styling options, comfortable fit, and modern design.',
        price: 64.99,
        salePrice: 54.99,
        stock: 70,
        sku: 'FASH-023',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
          'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 134,
      },
      {
        name: 'Pleated Midi Skirt',
        slug: 'pleated-midi-skirt',
        shortDesc: 'Elegant pleated midi skirt',
        description: 'Chic pleated midi skirt with flowing fabric. Perfect for office or casual wear, flattering length and timeless design.',
        price: 69.99,
        salePrice: 59.99,
        stock: 48,
        sku: 'FASH-024',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          'https://images.unsplash.com/photo-1566479179817-4c3ee5b56a6a?w=800',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 112,
      },
      {
        name: 'Ribbed Tank Top',
        slug: 'ribbed-tank-top',
        shortDesc: 'Comfortable ribbed tank top',
        description: 'Essential ribbed tank top perfect for layering or wearing alone. Soft fabric, comfortable fit, and versatile styling.',
        price: 24.99,
        salePrice: 19.99,
        stock: 120,
        sku: 'FASH-025',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.4,
        reviewCount: 201,
      },
      {
        name: 'Wool Blend Coat',
        slug: 'wool-blend-coat',
        shortDesc: 'Warm wool blend coat',
        description: 'Classic wool blend coat for winter 2025. Warm, durable, and stylish. Perfect for cold weather with timeless design.',
        price: 199.99,
        salePrice: 169.99,
        stock: 30,
        sku: 'FASH-026',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.9,
        reviewCount: 67,
      },
      {
        name: 'Linen Shorts',
        slug: 'linen-shorts',
        shortDesc: 'Breathable linen shorts',
        description: 'Comfortable linen shorts perfect for summer. Breathable fabric, relaxed fit, and casual style for warm weather.',
        price: 49.99,
        salePrice: 39.99,
        stock: 85,
        sku: 'FASH-027',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
          'https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.5,
        reviewCount: 145,
      },
      {
        name: 'Velvet Blazer',
        slug: 'velvet-blazer',
        shortDesc: 'Luxurious velvet blazer',
        description: 'Elegant velvet blazer perfect for special occasions. Premium fabric, tailored fit, and sophisticated design.',
        price: 179.99,
        salePrice: 149.99,
        stock: 25,
        sku: 'FASH-028',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.7,
        reviewCount: 89,
      },
      {
        name: 'Athletic Shorts',
        slug: 'athletic-shorts',
        shortDesc: 'Performance athletic shorts',
        description: 'High-performance athletic shorts perfect for workouts. Moisture-wicking fabric, comfortable fit, and flexible design.',
        price: 39.99,
        salePrice: 34.99,
        stock: 100,
        sku: 'FASH-029',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544966503-7cc75a1e7b08?w=800',
          'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
        ]),
        brand: 'Fashion 2025',
        rating: 4.6,
        reviewCount: 178,
      },
    ];
    
    console.log('Inserting clothing products...\n');
    for (const product of clothingProducts) {
      await pool.execute(
        `INSERT INTO products (name, slug, shortDesc, description, price, salePrice, stock, sku, images, categoryId, brand, rating, reviewCount, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [
          product.name,
          product.slug,
          product.shortDesc,
          product.description,
          product.price,
          product.salePrice,
          product.stock,
          product.sku,
          product.images,
          clothingCategoryId,
          product.brand,
          product.rating,
          product.reviewCount,
        ]
      );
      console.log(`  ✅ ${product.name}`);
    }
    
    // Verify products
    const [products] = await pool.execute(
      `SELECT p.id, p.name, p.price, p.salePrice, c.name as category, p.stock
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.categoryId = ?
       ORDER BY p.createdAt DESC`,
      [clothingCategoryId]
    );
    
    console.log(`\n✅ Total clothing products: ${products.length}`);
    console.log('\nSample products:');
    products.slice(0, 5).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.name} - $${p.salePrice || p.price}`);
    });
    
    console.log('\n✅ Products updated successfully!\n');
    
  } catch (error) {
    console.error('❌ Error updating products:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateProducts();

