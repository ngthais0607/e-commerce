-- ============================================
-- Script tạo Database cho E-Commerce Project
-- ============================================
-- Chạy script này với quyền root hoặc admin
-- MySQL 8.0+ required

-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 2. Tạo User (nếu chưa có)
CREATE USER IF NOT EXISTS 'ecommerce_user'@'localhost' 
    IDENTIFIED BY 'ecommerce_pass';

-- 3. Cấp quyền cho User
GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'localhost';

-- 4. Nếu muốn cho phép kết nối từ xa (optional)
-- CREATE USER IF NOT EXISTS 'ecommerce_user'@'%' IDENTIFIED BY 'ecommerce_pass';
-- GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'%';

-- 5. Áp dụng thay đổi
FLUSH PRIVILEGES;

-- 6. Kiểm tra database đã tạo
SHOW DATABASES LIKE 'ecommerce';

-- 7. Kiểm tra user đã tạo
SELECT user, host FROM mysql.user WHERE user = 'ecommerce_user';

-- ============================================
-- Thông tin kết nối:
-- Database: ecommerce
-- User: ecommerce_user
-- Password: ecommerce_pass
-- Host: localhost
-- Port: 3306
-- Connection String: mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce
-- ============================================

