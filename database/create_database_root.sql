-- ============================================
-- Script tạo Database cho E-Commerce Project
-- Sử dụng root user
-- ============================================
-- Chạy script này với quyền root
-- MySQL 8.0+ required

-- 1. Tạo Database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 2. Kiểm tra database đã tạo
SHOW DATABASES LIKE 'ecommerce';

-- 3. Sử dụng database
USE ecommerce;

-- ============================================
-- Thông tin kết nối:
-- Database: ecommerce
-- User: root
-- Password: quangthai123
-- Host: localhost
-- Port: 3306
-- Connection String: mysql://root:quangthai123@localhost:3306/ecommerce
-- ============================================

