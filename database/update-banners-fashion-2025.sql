-- ============================================
-- Update Banners to Fashion 2025 Theme
-- Each banner with different fashion 2025 images and content
-- ============================================

USE ecommerce;

-- Delete all existing homepage banners
DELETE FROM banners WHERE position = 'homepage';

-- Reset AUTO_INCREMENT to start fresh
ALTER TABLE banners AUTO_INCREMENT = 1;

-- Insert Fashion 2025 Banners with different images
INSERT INTO banners (title, image, link, position, isActive, sortOrder, createdAt, updatedAt) VALUES

-- Banner 1: Fashion 2025 Collection
('Fashion 2025 Collection', 
 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 1,
 NOW(),
 NOW()),

-- Banner 2: New Season Arrivals
('New Season Arrivals',
 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 2,
 NOW(),
 NOW()),

-- Banner 3: Designer Collection 2025
('Designer Collection 2025',
 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 3,
 NOW(),
 NOW()),

-- Banner 4: Street Style 2025
('Street Style 2025',
 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 4,
 NOW(),
 NOW()),

-- Banner 5: Luxury Fashion 2025
('Luxury Fashion 2025',
 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 5,
 NOW(),
 NOW()),

-- Banner 6: Sustainable Fashion
('Sustainable Fashion 2025',
 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop',
 '/shop?category=clothing',
 'homepage',
 TRUE,
 6,
 NOW(),
 NOW());

-- Verify banners
SELECT id, title, image, link, position, sortOrder, isActive 
FROM banners 
WHERE position = 'homepage' 
ORDER BY sortOrder;

