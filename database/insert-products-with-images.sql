-- ============================================
-- Insert Products with Images for E-Commerce
-- Comprehensive product data with multiple images per product
-- All descriptions in English
-- ============================================

USE ecommerce;

-- ============================================
-- 1. INSERT CATEGORIES (if not exists)
-- ============================================
INSERT INTO categories (id, name, slug, description, image, isActive) VALUES
(1, 'Electronics', 'electronics', 'Electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', TRUE),
(2, 'Clothing', 'clothing', 'Fashion and apparel for all occasions', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', TRUE),
(3, 'Home & Garden', 'home-garden', 'Home improvement and garden supplies', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', TRUE),
(4, 'Sports', 'sports', 'Sports equipment and accessories', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', TRUE),
(5, 'Books', 'books', 'Books and literature', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- 2. INSERT PRODUCTS WITH MULTIPLE IMAGES
-- ============================================
-- Electronics Category
INSERT INTO products (name, slug, shortDesc, description, price, salePrice, stock, sku, images, categoryId, brand, rating, reviewCount, isActive) VALUES

-- Electronics Products
('Wireless Bluetooth Headphones Pro', 'wireless-bluetooth-headphones-pro', 
'Premium noise-cancelling wireless headphones with 30-hour battery life', 
'Experience premium audio quality with our Wireless Bluetooth Headphones Pro. Features active noise cancellation, 30-hour battery life, quick charge capability, and premium sound quality. Perfect for travel, work, or daily commutes. Includes carrying case and charging cable.',
199.99, 149.99, 50, 'ELEC-001', 
'["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800","https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800"]', 
1, 'TechBrand', 4.5, 120, TRUE),

('Smart Watch Pro Series 9', 'smart-watch-pro-series-9', 
'Advanced smartwatch with health tracking and GPS', 
'Stay connected and healthy with the Smart Watch Pro Series 9. Features heart rate monitor, GPS tracking, fitness tracking, sleep monitoring, and smartphone notifications. Water-resistant design with 7-day battery life. Perfect for athletes and fitness enthusiasts.',
299.99, 249.99, 30, 'ELEC-002', 
'["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800","https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800","https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800"]', 
1, 'TechBrand', 4.7, 89, TRUE),

('Ergonomic Aluminum Laptop Stand', 'ergonomic-aluminum-laptop-stand', 
'Adjustable laptop stand for better posture', 
'Improve your workspace with our Ergonomic Aluminum Laptop Stand. Adjustable height and angle for optimal viewing. Reduces neck and back strain. Lightweight yet sturdy design. Compatible with all laptop sizes up to 17 inches.',
49.99, 39.99, 100, 'ELEC-003', 
'["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800","https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"]', 
1, 'OfficePro', 4.3, 45, TRUE),

('Wireless Charging Pad', 'wireless-charging-pad', 
'Fast wireless charging pad for smartphones', 
'Charge your devices wirelessly with our Fast Wireless Charging Pad. Compatible with all Qi-enabled devices. LED indicator shows charging status. Sleek design that fits any desk or nightstand.',
29.99, 24.99, 150, 'ELEC-004', 
'["https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800","https://images.unsplash.com/photo-1609091834311-431482e7c1b1?w=800"]', 
1, 'TechBrand', 4.4, 67, TRUE),

('Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 
'Waterproof portable speaker with 360° sound', 
'Take your music anywhere with our Portable Bluetooth Speaker. Waterproof design, 360° sound, 20-hour battery life, and built-in microphone for hands-free calls. Perfect for outdoor adventures, parties, or home use.',
79.99, 59.99, 80, 'ELEC-005', 
'["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800","https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80"]', 
1, 'AudioMax', 4.6, 145, TRUE),

('4K Ultra HD Smart TV 55"', '4k-ultra-hd-smart-tv-55', 
'55-inch 4K Smart TV with HDR and streaming apps', 
'Transform your entertainment experience with our 55-inch 4K Ultra HD Smart TV. Features HDR technology, built-in streaming apps, voice control, and multiple HDMI ports. Crystal-clear picture quality and immersive sound.',
599.99, 499.99, 25, 'ELEC-006', 
'["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800","https://images.unsplash.com/photo-1467293622093-9f15c96be70f?w=800"]', 
1, 'VisionTech', 4.8, 203, TRUE),

-- Clothing Products
('Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 
'Comfortable 100% organic cotton t-shirt', 
'Soft and breathable 100% organic cotton t-shirt. Available in multiple colors and sizes. Pre-shrunk fabric ensures perfect fit. Classic crew neck design. Perfect for casual wear or layering.',
24.99, 19.99, 200, 'CLOTH-001', 
'["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]', 
2, 'FashionCo', 4.2, 67, TRUE),

('Classic Fit Denim Jeans', 'classic-fit-denim-jeans', 
'Classic fit denim jeans with stretch', 
'Classic fit denim jeans with stretch for comfort and durability. Made from premium denim fabric. Available in multiple washes and sizes. Perfect for everyday wear.',
79.99, 59.99, 150, 'CLOTH-002', 
'["https://images.unsplash.com/photo-1542272604-787c6833e06f?w=800","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800","https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"]', 
2, 'FashionCo', 4.4, 92, TRUE),

('Wool Blend Winter Coat', 'wool-blend-winter-coat', 
'Warm and stylish winter coat with wool blend', 
'Stay warm and stylish with our Wool Blend Winter Coat. Features water-resistant outer shell, warm inner lining, and multiple pockets. Classic design that never goes out of style. Perfect for cold weather.',
149.99, 119.99, 60, 'CLOTH-003', 
'["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800","https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"]', 
2, 'FashionCo', 4.5, 78, TRUE),

('Leather Jacket Classic', 'leather-jacket-classic', 
'Genuine leather jacket with classic design', 
'Timeless style with our Genuine Leather Jacket. Made from premium quality leather. Classic biker style with zippered pockets. Durable construction that ages beautifully.',
199.99, 169.99, 40, 'CLOTH-004', 
'["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800"]', 
2, 'FashionCo', 4.6, 112, TRUE),

('Running Athletic Shorts', 'running-athletic-shorts', 
'Lightweight and breathable running shorts', 
'Perfect for your workout with our Running Athletic Shorts. Lightweight, breathable fabric with moisture-wicking technology. Elastic waistband with drawstring. Multiple pockets for essentials.',
34.99, 29.99, 120, 'CLOTH-005', 
'["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800"]', 
2, 'SportMax', 4.3, 56, TRUE),

('Designer Sunglasses', 'designer-sunglasses', 
'UV protection sunglasses with polarized lenses', 
'Protect your eyes in style with our Designer Sunglasses. Polarized lenses reduce glare and provide 100% UV protection. Lightweight frame with comfortable fit. Includes protective case.',
89.99, 69.99, 90, 'CLOTH-006', 
'["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800","https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"]', 
2, 'FashionCo', 4.7, 134, TRUE),

-- Sports Products
('Professional Running Shoes', 'professional-running-shoes', 
'Lightweight running shoes with cushioned sole', 
'Professional running shoes designed for performance. Cushioned sole for impact absorption, breathable mesh upper, and durable outsole. Perfect for long-distance running and training.',
89.99, 69.99, 80, 'SPORT-001', 
'["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","https://images.unsplash.com/photo-1544966503-7cc75a1e7b08?w=800","https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800"]', 
4, 'SportMax', 4.6, 145, TRUE),

('Premium Yoga Mat', 'premium-yoga-mat', 
'Non-slip yoga mat with carrying strap', 
'Premium non-slip yoga mat perfect for all yoga practices. Extra thick for comfort, includes carrying strap. Eco-friendly materials. Available in multiple colors.',
34.99, 29.99, 120, 'SPORT-002', 
'["https://images.unsplash.com/photo-1601925260368-ae2f83d34d68?w=800","https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800"]', 
4, 'SportMax', 4.5, 78, TRUE),

('Adjustable Dumbbell Set', 'adjustable-dumbbell-set', 
'Adjustable dumbbells from 5-50 lbs each', 
'Complete home gym solution with our Adjustable Dumbbell Set. Quick-change weight system from 5-50 lbs per dumbbell. Space-saving design. Perfect for strength training at home.',
299.99, 249.99, 35, 'SPORT-003', 
'["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"]', 
4, 'FitnessPro', 4.7, 98, TRUE),

('Basketball Official Size', 'basketball-official-size', 
'Official size basketball with premium grip', 
'Official size basketball with premium grip surface. Durable construction for indoor and outdoor use. Meets official size and weight standards. Perfect for practice and games.',
39.99, 34.99, 100, 'SPORT-004', 
'["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800","https://images.unsplash.com/photo-1519861531473-92002f610fdf?w=800"]', 
4, 'SportMax', 4.4, 67, TRUE),

('Tennis Racket Pro', 'tennis-racket-pro', 
'Professional tennis racket with carbon fiber frame', 
'Professional tennis racket with carbon fiber frame for power and control. Pre-strung with premium strings. Ergonomic grip. Perfect for intermediate to advanced players.',
129.99, 99.99, 50, 'SPORT-005', 
'["https://images.unsplash.com/photo-1622163642992-9a0f7b3b9d06?w=800","https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800"]', 
4, 'SportMax', 4.6, 89, TRUE),

('Cycling Helmet Safety', 'cycling-helmet-safety', 
'Lightweight cycling helmet with ventilation', 
'Stay safe on your rides with our Cycling Helmet. Lightweight design with excellent ventilation. Adjustable fit system. Meets all safety standards. Available in multiple sizes.',
59.99, 49.99, 70, 'SPORT-006', 
'["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"]', 
4, 'SafetyGear', 4.5, 112, TRUE),

-- Home & Garden Products
('Programmable Coffee Maker', 'programmable-coffee-maker', 
'12-cup programmable coffee maker with auto shut-off', 
'Start your day right with our Programmable Coffee Maker. 12-cup capacity, programmable timer, auto shut-off, and brew strength control. Removable filter basket for easy cleaning.',
59.99, 49.99, 60, 'HOME-001', 
'["https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800","https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800","https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&q=80"]', 
3, 'HomeEssentials', 4.3, 56, TRUE),

('Complete Garden Tool Set', 'complete-garden-tool-set', 
'Essential garden tools including trowel, pruner, and gloves', 
'Complete set of essential garden tools for all your gardening needs. Includes trowel, pruner, weeder, cultivator, and gardening gloves. Durable steel construction with comfortable handles.',
39.99, 34.99, 90, 'HOME-002', 
'["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800","https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800"]', 
3, 'GardenPro', 4.4, 34, TRUE),

('Memory Foam Mattress Topper', 'memory-foam-mattress-topper', 
'3-inch memory foam mattress topper for comfort', 
'Transform your sleep with our 3-inch Memory Foam Mattress Topper. Conforms to your body shape, reduces pressure points, and provides superior comfort. Hypoallergenic and breathable.',
79.99, 64.99, 45, 'HOME-003', 
'["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"]', 
3, 'ComfortSleep', 4.6, 123, TRUE),

('Smart LED Light Bulbs Pack', 'smart-led-light-bulbs-pack', 
'WiFi-enabled smart LED bulbs with app control', 
'Control your lighting from anywhere with our Smart LED Light Bulbs. WiFi-enabled, app control, voice assistant compatible, and dimmable. Energy-efficient LED technology. Pack of 4 bulbs.',
49.99, 39.99, 110, 'HOME-004', 
'["https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800","https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"]', 
3, 'SmartHome', 4.5, 89, TRUE),

('Stainless Steel Cookware Set', 'stainless-steel-cookware-set', 
'10-piece stainless steel cookware set', 
'Professional-grade 10-piece stainless steel cookware set. Includes pots, pans, and lids. Even heat distribution, dishwasher safe, and compatible with all cooktops. Perfect for any kitchen.',
149.99, 119.99, 40, 'HOME-005', 
'["https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800","https://images.unsplash.com/photo-1556911220-e15b29be4c89?w=800"]', 
3, 'KitchenPro', 4.7, 156, TRUE),

('Indoor Plant Collection', 'indoor-plant-collection', 
'Set of 3 low-maintenance indoor plants', 
'Bring nature indoors with our Indoor Plant Collection. Set of 3 low-maintenance plants perfect for beginners. Includes decorative pots and care instructions. Improves air quality.',
44.99, 39.99, 55, 'HOME-006', 
'["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800","https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800","https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800"]', 
3, 'GardenPro', 4.4, 78, TRUE),

-- Books Products
('Modern Programming Guide', 'modern-programming-guide', 
'Comprehensive guide to modern programming languages', 
'Learn modern programming with our comprehensive guide. Covers Python, JavaScript, React, and more. Includes practical examples, exercises, and best practices. Perfect for beginners and intermediate developers.',
49.99, 39.99, 200, 'BOOK-001', 
'["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800","https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800","https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800"]', 
5, 'TechBooks', 4.7, 203, TRUE),

('Business Strategy Masterclass', 'business-strategy-masterclass', 
'Essential guide to business strategy and leadership', 
'Master business strategy with this comprehensive guide. Learn from real-world case studies, strategic frameworks, and leadership principles. Perfect for entrepreneurs and business leaders.',
34.99, 29.99, 150, 'BOOK-002', 
'["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","https://images.unsplash.com/photo-1512820790803-83ca750da946?w=800"]', 
5, 'BusinessBooks', 4.6, 134, TRUE),

('Cooking Recipes Collection', 'cooking-recipes-collection', 
'500+ recipes from around the world', 
'Discover 500+ delicious recipes from around the world. Includes appetizers, main courses, desserts, and more. Beautiful photography and step-by-step instructions. Perfect for home cooks.',
39.99, 34.99, 120, 'BOOK-003', 
'["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","https://images.unsplash.com/photo-1512820790803-83ca750da946?w=800"]', 
5, 'CulinaryBooks', 4.5, 98, TRUE),

('Science Fiction Novel Series', 'science-fiction-novel-series', 
'Bestselling science fiction trilogy', 
'Immerse yourself in this bestselling science fiction trilogy. Epic space adventure with compelling characters and intricate plot. Award-winning author. Perfect for sci-fi enthusiasts.',
44.99, 39.99, 180, 'BOOK-004', 
'["https://images.unsplash.com/photo-1512820790803-83ca750da946?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800"]', 
5, 'FictionBooks', 4.8, 267, TRUE),

('Photography Techniques Guide', 'photography-techniques-guide', 
'Complete guide to photography techniques and composition', 
'Master photography with our comprehensive guide. Covers camera settings, composition, lighting, and post-processing. Includes stunning examples and practical tips. Perfect for beginners and enthusiasts.',
54.99, 44.99, 90, 'BOOK-005', 
'["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800","https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800","https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800"]', 
5, 'PhotoBooks', 4.6, 145, TRUE),

('Children\'s Storybook Collection', 'childrens-storybook-collection', 
'Beautifully illustrated children\'s storybook set', 
'Delight young readers with our beautifully illustrated children\'s storybook collection. Set of 5 classic stories with modern illustrations. Perfect for bedtime reading. Ages 3-8.',
29.99, 24.99, 160, 'BOOK-006', 
'["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","https://images.unsplash.com/photo-1512820790803-83ca750da946?w=800","https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800"]', 
5, 'KidsBooks', 4.7, 189, TRUE),

-- Extra Electronics Products (to reach ~10)
('USB-C Hub 7-in-1', 'usb-c-hub-7-in-1',
'USB-C hub with HDMI, USB and SD card slots',
'Expand your laptop connectivity with this compact 7-in-1 USB-C hub. Features HDMI, USB-A, USB-C and SD/microSD card slots. Aluminum body, plug-and-play.',
39.99, 34.99, 120, 'ELEC-007',
'["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800","https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"]',
1, 'TechBrand', 4.4, 52, TRUE),

('Noise Cancelling Earbuds', 'noise-cancelling-earbuds',
'True wireless earbuds with ANC and case',
'Compact true wireless earbuds with active noise cancelling, 24-hour battery with charging case and touch controls. IPX4 sweat resistant.',
129.99, 99.99, 90, 'ELEC-008',
'["https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800","https://images.unsplash.com/photo-1589820296156-2454bb8b367e?w=800"]',
1, 'AudioMax', 4.5, 77, TRUE),

('Mechanical Gaming Keyboard', 'mechanical-gaming-keyboard',
'RGB mechanical keyboard with blue switches',
'Full-size mechanical gaming keyboard with RGB backlight, blue switches and detachable wrist rest. N-key rollover and programmable macros.',
119.99, 89.99, 70, 'ELEC-009',
'["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800","https://images.unsplash.com/photo-1512427691650-1e0c2f9a81b3?w=800"]',
1, 'GameTech', 4.6, 134, TRUE),

('1080p Web Camera', '1080p-web-camera',
'Full HD webcam with built-in microphone',
'Full HD 1080p webcam for streaming and video calls. Auto focus, wide angle lens and noise-reducing microphone. Clip-on mount for monitors and laptops.',
69.99, 54.99, 85, 'ELEC-010',
'["https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800","https://images.unsplash.com/photo-1594904351111-7bcd5900c3a0?w=800"]',
1, 'OfficePro', 4.3, 41, TRUE),

-- Extra Clothing Products
('Performance Hoodie', 'performance-hoodie',
'Lightweight hoodie for training and casual wear',
'Moisture-wicking performance hoodie with slim fit, thumb holes and kangaroo pocket. Ideal for warm-up, gym or daily wear.',
59.99, 49.99, 110, 'CLOTH-007',
'["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800","https://images.unsplash.com/photo-1526481280695-3c687fd543c0?w=800"]',
2, 'SportMax', 4.4, 63, TRUE),

('Slim Fit Chinos', 'slim-fit-chinos',
'Stretch cotton chinos for office and weekend',
'Versatile slim fit chinos made from stretch cotton. Mid-rise, tapered leg and multiple color options. Works with shirts or t-shirts.',
69.99, 54.99, 140, 'CLOTH-008',
'["https://images.unsplash.com/photo-1495121553079-4c61bcce189c?w=800","https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=800"]',
2, 'FashionCo', 4.3, 58, TRUE),

('Everyday Sneakers', 'everyday-sneakers',
'Minimal sneakers for daily use',
'Clean and minimal sneakers with cushioned insole and rubber outsole. Works with jeans, chinos and shorts.',
79.99, 64.99, 95, 'CLOTH-009',
'["https://images.unsplash.com/photo-1519741497674-611481863552?w=800","https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"]',
2, 'UrbanStep', 4.5, 101, TRUE),

('Classic Polo Shirt', 'classic-polo-shirt',
'Cotton pique polo shirt',
'Classic polo shirt made from breathable cotton pique. Ribbed collar and cuffs, two-button placket. Smart casual essential.',
39.99, 29.99, 180, 'CLOTH-010',
'["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]',
2, 'FashionCo', 4.2, 74, TRUE),

-- Extra Sports Products
('Foam Roller Recovery', 'foam-roller-recovery',
'High-density foam roller for muscle recovery',
'High-density foam roller ideal for myofascial release, stretching and recovery after workouts.',
29.99, 24.99, 130, 'SPORT-007',
'["https://images.unsplash.com/photo-1554344058-8d1d1dbc5960?w=800","https://images.unsplash.com/photo-1599059819516-07b1b1a9a7e6?w=800"]',
4, 'FitnessPro', 4.4, 65, TRUE),

('Training Jump Rope', 'training-jump-rope',
'Adjustable speed jump rope',
'Adjustable speed jump rope with ball bearings and comfortable handles. Great for cardio and warm-up.',
19.99, 14.99, 200, 'SPORT-008',
'["https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800","https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800"]',
4, 'SportMax', 4.3, 48, TRUE),

('Indoor Fitness Bike', 'indoor-fitness-bike',
'Adjustable indoor cycling bike',
'Sturdy indoor cycling bike with adjustable resistance, LCD display and comfortable seat. Perfect for home workouts.',
499.99, 429.99, 20, 'SPORT-009',
'["https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800","https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80"]',
4, 'FitnessPro', 4.6, 72, TRUE),

('Multi-Sport Gym Bag', 'multi-sport-gym-bag',
'Spacious gym bag with shoe compartment',
'Durable gym bag with ventilated shoe compartment, wet pocket and multiple organizers. Suitable for gym and short trips.',
69.99, 54.99, 85, 'SPORT-010',
'["https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]',
4, 'SportMax', 4.5, 59, TRUE),

-- Extra Home & Garden Products
('Aroma Diffuser Lamp', 'aroma-diffuser-lamp',
'Essential oil diffuser with ambient light',
'Ultrasonic essential oil diffuser with warm ambient light. 4 timing modes and auto shut-off. Adds fragrance and atmosphere to your home.',
44.99, 34.99, 75, 'HOME-007',
'["https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800","https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80"]',
3, 'HomeEssentials', 4.4, 61, TRUE),

('Minimalist Wall Shelf Set', 'minimalist-wall-shelf-set',
'Set of 3 floating wall shelves',
'Set of three floating wall shelves for displaying decor, books or plants. Includes mounting hardware.',
59.99, 49.99, 90, 'HOME-008',
'["https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"]',
3, 'HomeEssentials', 4.3, 47, TRUE),

('Luxury Bath Towel Set', 'luxury-bath-towel-set',
'6-piece cotton bath towel set',
'Soft and absorbent 100% cotton bath towel set. Includes bath towels, hand towels and washcloths.',
69.99, 54.99, 110, 'HOME-009',
'["https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"]',
3, 'ComfortHome', 4.6, 88, TRUE),

('Outdoor String Lights', 'outdoor-string-lights',
'Weatherproof LED string lights',
'Warm white LED string lights for balcony, garden or patio. Weatherproof and connectable up to 5 sets.',
39.99, 29.99, 140, 'HOME-010',
'["https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800","https://images.unsplash.com/photo-1438109491414-7198515b166b?w=800"]',
3, 'GardenPro', 4.5, 94, TRUE),

-- Extra Books Products
('Mindfulness Daily Journal', 'mindfulness-daily-journal',
'Guided journal for mindfulness and gratitude',
'Daily journal with prompts for mindfulness, gratitude and reflection. 180 days of guided pages.',
24.99, 19.99, 190, 'BOOK-007',
'["https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=800","https://images.unsplash.com/photo-1513475382585-d06e58bcb0ea?w=800"]',
5, 'WellnessBooks', 4.5, 121, TRUE),

('Productivity Playbook', 'productivity-playbook',
'Strategies to improve productivity and focus',
'Actionable strategies to organize your time, reduce distractions and get more done. Includes worksheets and checklists.',
32.99, 27.99, 160, 'BOOK-008',
'["https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=800","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"]',
5, 'BusinessBooks', 4.4, 87, TRUE),

('Travel Photography Stories', 'travel-photography-stories',
'Coffee table book of travel photos and stories',
'Coffee table book featuring stunning travel photography and behind-the-scenes stories from around the world.',
59.99, 49.99, 80, 'BOOK-009',
'["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800","https://images.unsplash.com/photo-1500534314211-0a24cd038ebd?w=800"]',
5, 'PhotoBooks', 4.7, 76, TRUE),

('Fantasy Epic Saga', 'fantasy-epic-saga',
'Epic fantasy novel with rich world-building',
'High fantasy novel set in a richly detailed world with complex characters and magic system. First book of an upcoming series.',
39.99, 34.99, 140, 'BOOK-010',
'["https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800","https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=800"]',
5, 'FictionBooks', 4.8, 132, TRUE)

ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- 3. INSERT BANNERS
-- ============================================
INSERT INTO banners (title, image, link, position, isActive, sortOrder) VALUES
('Summer Sale - Up to 50% Off', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200', '/shop?category=all', 'homepage', TRUE, 1),
('New Arrivals - Electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200', '/shop?category=electronics', 'homepage', TRUE, 2),
('Fashion Collection 2024', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', '/shop?category=clothing', 'homepage', TRUE, 3),
('Free Shipping on Orders Over $50', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200', '/shop', 'sidebar', TRUE, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- ============================================
-- 4. VERIFY DATA
-- ============================================
SELECT 
    c.name as category,
    COUNT(p.id) as product_count,
    AVG(p.rating) as avg_rating,
    SUM(p.stock) as total_stock
FROM categories c
LEFT JOIN products p ON c.id = p.categoryId
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT 
    COUNT(*) as total_products,
    SUM(CASE WHEN JSON_LENGTH(images) > 1 THEN 1 ELSE 0 END) as products_with_multiple_images,
    AVG(rating) as average_rating,
    SUM(reviewCount) as total_reviews
FROM products;

-- ============================================
-- Summary
-- ============================================
-- This script inserts:
-- - 5 Categories with images
-- - 30 Products across all categories
-- - Multiple images per product (2-3 images each)
-- - Real product images from Unsplash
-- - 4 Banner images for homepage and sidebar
-- - All descriptions in English
-- - Realistic pricing, ratings, and stock levels
-- ============================================

