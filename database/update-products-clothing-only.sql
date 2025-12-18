-- ============================================
-- Update Products to Clothing/Fashion Only
-- Remove non-clothing products and add fashion 2025 products
-- ============================================

USE ecommerce;

-- Get Clothing category ID
SET @clothing_category_id = (SELECT id FROM categories WHERE slug = 'clothing' OR name LIKE '%Clothing%' OR name LIKE '%Fashion%' LIMIT 1);

-- If clothing category doesn't exist, create it
INSERT INTO categories (name, slug, description, image, isActive)
SELECT 'Fashion & Clothing', 'clothing', 'Fashion and apparel for all occasions', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'clothing');

SET @clothing_category_id = (SELECT id FROM categories WHERE slug = 'clothing' LIMIT 1);

-- Delete all products that are NOT in clothing category
DELETE FROM products 
WHERE categoryId != @clothing_category_id;

-- Delete existing clothing products to start fresh
DELETE FROM products WHERE categoryId = @clothing_category_id;

-- Insert Fashion 2025 Clothing Products
INSERT INTO products (name, slug, shortDesc, description, price, salePrice, stock, sku, images, categoryId, brand, rating, reviewCount, isActive) VALUES

-- Women's Fashion
('Elegant Summer Dress 2025', 'elegant-summer-dress-2025',
 'Stylish summer dress perfect for any occasion',
 'Discover elegance with our 2025 summer dress collection. Made from premium breathable fabric, this dress features a modern silhouette that flatters every body type. Perfect for casual outings, office wear, or special events. Available in multiple colors and sizes.',
 89.99, 69.99, 45, 'FASH-001',
 '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800","https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800","https://images.unsplash.com/photo-1566479179817-4c3ee5b56a6a?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 89, TRUE),

('Classic Denim Jacket', 'classic-denim-jacket',
 'Timeless denim jacket for every wardrobe',
 'A wardrobe essential for 2025. This classic denim jacket combines comfort with style. Made from premium denim, it features a relaxed fit perfect for layering. Versatile design that pairs well with dresses, t-shirts, or casual outfits.',
 79.99, 59.99, 60, 'FASH-002',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 124, TRUE),

('Premium Cotton T-Shirt', 'premium-cotton-t-shirt',
 'Soft and comfortable cotton t-shirt',
 'Essential basic t-shirt made from 100% organic cotton. Soft, breathable, and perfect for everyday wear. Available in multiple colors. Sustainable fashion choice for 2025.',
 29.99, 24.99, 100, 'FASH-003',
 '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.4, 156, TRUE),

('Designer Blazer 2025', 'designer-blazer-2025',
 'Professional blazer for modern women',
 'Elevate your professional wardrobe with this designer blazer. Tailored fit, premium fabric, and timeless design. Perfect for business meetings, interviews, or formal events. A must-have for the modern professional woman.',
 149.99, 119.99, 35, 'FASH-004',
 '["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.7, 78, TRUE),

('Casual Wide Leg Pants', 'casual-wide-leg-pants',
 'Comfortable and stylish wide leg pants',
 'Trendy wide leg pants perfect for 2025 fashion. Comfortable fit with a modern silhouette. Made from high-quality fabric that drapes beautifully. Perfect for both casual and semi-formal occasions.',
 69.99, 54.99, 50, 'FASH-005',
 '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800","https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800","https://images.unsplash.com/photo-1624378637149-5d7e5e5e5e5e?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 92, TRUE),

-- Men's Fashion
('Classic White Dress Shirt', 'classic-white-dress-shirt',
 'Professional dress shirt for men',
 'Crisp white dress shirt perfect for business or formal occasions. Premium cotton fabric, classic fit, and impeccable tailoring. A timeless piece that never goes out of style.',
 59.99, 49.99, 70, 'FASH-006',
 '["https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800","https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 112, TRUE),

('Slim Fit Chinos', 'slim-fit-chinos',
 'Versatile chinos for everyday wear',
 'Modern slim fit chinos in classic colors. Perfect for both casual and smart casual looks. Comfortable fabric with stretch for all-day comfort. Essential piece for the modern man\'s wardrobe.',
 64.99, 49.99, 65, 'FASH-007',
 '["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800","https://images.unsplash.com/photo-1542272604-787c3835535d?w=800","https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 98, TRUE),

('Hooded Sweatshirt', 'hooded-sweatshirt',
 'Comfortable hooded sweatshirt',
 'Cozy and stylish hooded sweatshirt perfect for casual wear. Soft fabric, comfortable fit, and modern design. Perfect for lounging, workouts, or casual outings.',
 54.99, 44.99, 80, 'FASH-008',
 '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.4, 134, TRUE),

('Leather Jacket', 'leather-jacket',
 'Classic leather jacket',
 'Timeless leather jacket with modern details. Premium genuine leather, perfect fit, and classic design. A statement piece that elevates any outfit.',
 199.99, 159.99, 25, 'FASH-009',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.8, 67, TRUE),

('Casual Polo Shirt', 'casual-polo-shirt',
 'Versatile polo shirt',
 'Classic polo shirt in premium cotton. Perfect for casual Fridays, weekend outings, or smart casual events. Comfortable fit and timeless style.',
 39.99, 34.99, 90, 'FASH-010',
 '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 145, TRUE),

-- Unisex Fashion
('Oversized Hoodie', 'oversized-hoodie',
 'Comfortable oversized hoodie',
 'Trendy oversized hoodie perfect for 2025 street style. Soft fabric, relaxed fit, and modern design. Perfect for layering or wearing alone.',
 49.99, 39.99, 75, 'FASH-011',
 '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 178, TRUE),

('High-Waisted Jeans', 'high-waisted-jeans',
 'Stylish high-waisted jeans',
 'Modern high-waisted jeans with perfect fit. Flattering silhouette, premium denim, and comfortable stretch. A must-have for any fashion-forward wardrobe.',
 89.99, 74.99, 55, 'FASH-012',
 '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800","https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800","https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.7, 203, TRUE),

('Crop Top', 'crop-top',
 'Trendy crop top',
 'Fashion-forward crop top perfect for 2025. Comfortable fabric, flattering fit, and versatile styling options. Pair with high-waisted pants or skirts.',
 34.99, 29.99, 85, 'FASH-013',
 '["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 167, TRUE),

('Midi Skirt', 'midi-skirt',
 'Elegant midi skirt',
 'Chic midi skirt perfect for office or casual wear. Flowing fabric, flattering length, and timeless design. Versatile piece that works for any occasion.',
 59.99, 49.99, 40, 'FASH-014',
 '["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 94, TRUE),

('Trench Coat', 'trench-coat',
 'Classic trench coat',
 'Timeless trench coat for all seasons. Water-resistant fabric, classic design, and perfect fit. A wardrobe essential that never goes out of style.',
 179.99, 149.99, 30, 'FASH-015',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.8, 56, TRUE),

('Athletic Leggings', 'athletic-leggings',
 'Comfortable athletic leggings',
 'High-performance leggings perfect for workouts or casual wear. Moisture-wicking fabric, comfortable fit, and stylish design. Perfect for the active lifestyle.',
 44.99, 39.99, 95, 'FASH-016',
 '["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800","https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800","https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 189, TRUE),

('Knit Sweater', 'knit-sweater',
 'Cozy knit sweater',
 'Warm and cozy knit sweater perfect for cooler weather. Soft fabric, comfortable fit, and classic design. A winter wardrobe essential.',
 74.99, 64.99, 60, 'FASH-017',
 '["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 142, TRUE),

('Cargo Pants', 'cargo-pants',
 'Functional cargo pants',
 'Stylish cargo pants with multiple pockets. Comfortable fit, durable fabric, and modern design. Perfect for casual or street style looks.',
 79.99, 69.99, 45, 'FASH-018',
 '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800","https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800","https://images.unsplash.com/photo-1624378515192-6b4d269bbdee?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.5, 118, TRUE),

('Silk Blouse', 'silk-blouse',
 'Luxurious silk blouse',
 'Elegant silk blouse perfect for special occasions. Premium fabric, flattering fit, and sophisticated design. A luxury piece for the modern wardrobe.',
 119.99, 99.99, 35, 'FASH-019',
 '["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.7, 76, TRUE),

('Bomber Jacket', 'bomber-jacket',
 'Stylish bomber jacket',
 'Trendy bomber jacket perfect for 2025 street style. Lightweight fabric, comfortable fit, and modern design. Perfect for layering in any season.',
 94.99, 79.99, 50, 'FASH-020',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800"]',
 @clothing_category_id, 'Fashion 2025', 4.6, 103, TRUE);

-- Verify products
SELECT 
    p.id,
    p.name,
    p.price,
    p.salePrice,
    c.name as category,
    p.stock,
    p.isActive
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
WHERE c.slug = 'clothing' OR c.name LIKE '%Clothing%' OR c.name LIKE '%Fashion%'
ORDER BY p.createdAt DESC;

