-- Fix category name to display correctly
USE ecommerce;

-- Check current category name
SELECT id, name, slug FROM categories WHERE id = 2;

-- Update category name to "Clothing" or "Fashion" if needed
UPDATE categories 
SET name = 'Clothing', 
    slug = 'clothing',
    updatedAt = NOW()
WHERE id = 2 AND (name = 'General' OR name IS NULL);

-- Verify update
SELECT id, name, slug FROM categories WHERE id = 2;

