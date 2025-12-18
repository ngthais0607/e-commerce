-- ============================================
-- Database Creation Script for E-Commerce Project
-- ============================================
-- Run this script with root or admin privileges
-- MySQL 8.0+ required
-- ============================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 2. Create User (if not exists)
CREATE USER IF NOT EXISTS 'ecommerce_user'@'localhost' 
    IDENTIFIED BY 'ecommerce_pass';

-- 3. Grant Privileges to User
GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'localhost';

-- 4. Allow remote connections (optional - uncomment if needed)
-- CREATE USER IF NOT EXISTS 'ecommerce_user'@'%' IDENTIFIED BY 'ecommerce_pass';
-- GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'%';

-- 5. Apply Changes
FLUSH PRIVILEGES;

-- 6. Verify database creation
SHOW DATABASES LIKE 'ecommerce';

-- 7. Verify user creation
SELECT user, host FROM mysql.user WHERE user = 'ecommerce_user';

-- ============================================
-- Connection Information:
-- Database: ecommerce
-- User: ecommerce_user
-- Password: ecommerce_pass
-- Host: localhost
-- Port: 3306
-- 
-- Connection String for .env:
-- DATABASE_URL="mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce"
-- ============================================
-- 
-- NEXT STEPS:
-- 1. Add DATABASE_URL to apps/api/.env
-- 2. Run: mysql -u root -p ecommerce < database/ecommerce_tables_v2.sql
-- 3. Or use the setup scripts: setup_database.bat / setup_database.sh
-- ============================================

