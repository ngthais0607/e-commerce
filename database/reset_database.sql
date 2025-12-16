-- ============================================
-- Database Reset Script
-- ============================================
-- WARNING: This will DELETE all data!
-- Use with caution in production
-- ============================================

-- Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS order_messages;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_conversations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS clients;

-- Drop database
DROP DATABASE IF EXISTS ecommerce;

-- Recreate database
CREATE DATABASE ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ecommerce;

-- ============================================
-- After running this script, run:
-- mysql -u root -p ecommerce < database/ecommerce_tables_v2.sql
-- ============================================

