-- ============================================
-- Script tạo Database và Tables cho E-Commerce Project
-- ============================================
-- Chạy script này với quyền root hoặc admin
-- MySQL 8.0+ required
-- ============================================

-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE ecommerce;

-- ============================================
-- 2. TẠO CÁC BẢNG (TABLES)
-- ============================================

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    role ENUM('CUSTOMER', 'ADMIN', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    postalCode VARCHAR(20) NULL,
    isDefault BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_userId (userId),
    INDEX idx_userId_isDefault (userId, isDefault),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    image VARCHAR(500) NULL,
    parentId INT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_slug (slug),
    INDEX idx_parentId (parentId),
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    shortDesc TEXT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    salePrice DECIMAL(10, 2) NULL,
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR(100) NULL UNIQUE,
    images JSON NOT NULL,
    attributes JSON NULL,
    categoryId INT NOT NULL,
    brand VARCHAR(100) NULL,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    reviewCount INT NOT NULL DEFAULT 0,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_categoryId (categoryId),
    INDEX idx_slug (slug),
    INDEX idx_isActive (isActive),
    INDEX idx_categoryId_isActive (categoryId, isActive),
    INDEX idx_brand (brand),
    INDEX idx_createdAt (createdAt),
    INDEX idx_rating (rating),
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Coupons (tạo trước Orders vì Orders có foreign key tham chiếu)
CREATE TABLE IF NOT EXISTS coupons (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('PERCENT', 'FIXED') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minOrderAmount DECIMAL(10, 2) NULL,
    maxDiscount DECIMAL(10, 2) NULL,
    usageLimit INT NULL,
    usedCount INT NOT NULL DEFAULT 0,
    validFrom DATETIME(3) NOT NULL,
    validUntil DATETIME(3) NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_isActive (isActive),
    INDEX idx_isActive_validFrom_validUntil (isActive, validFrom, validUntil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderNumber VARCHAR(100) NOT NULL UNIQUE,
    userId INT NOT NULL,
    shippingAddress JSON NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    notes TEXT NULL,
    status ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    paymentMethod VARCHAR(100) NOT NULL,
    paymentStatus ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    subtotal DECIMAL(10, 2) NOT NULL,
    shippingFee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    couponCode VARCHAR(50) NULL,
    trackingCode VARCHAR(100) NULL,
    internalNotes TEXT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_userId (userId),
    INDEX idx_status (status),
    INDEX idx_orderNumber (orderNumber),
    INDEX idx_userId_status (userId, status),
    INDEX idx_createdAt (createdAt),
    INDEX idx_paymentStatus (paymentStatus),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (couponCode) REFERENCES coupons(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    attributes JSON NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_orderId (orderId),
    INDEX idx_productId (productId),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    productId INT NOT NULL,
    rating INT NOT NULL,
    title VARCHAR(255) NULL,
    comment TEXT NULL,
    isVerified BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY unique_user_product (userId, productId),
    INDEX idx_productId (productId),
    INDEX idx_userId (userId),
    INDEX idx_productId_rating (productId, rating),
    INDEX idx_createdAt (createdAt),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Banners
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(500) NOT NULL,
    link VARCHAR(500) NULL,
    position VARCHAR(100) NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_position_isActive (position, isActive),
    INDEX idx_position_isActive_sortOrder (position, isActive, sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    productId INT NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY unique_user_product (userId, productId),
    INDEX idx_userId (userId),
    INDEX idx_productId (productId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HOÀN TẤT
-- ============================================
-- Tất cả các bảng đã được tạo thành công!
-- 
-- Các bảng đã tạo:
-- 1. users - Người dùng
-- 2. addresses - Địa chỉ
-- 3. categories - Danh mục sản phẩm
-- 4. products - Sản phẩm
-- 5. orders - Đơn hàng
-- 6. order_items - Chi tiết đơn hàng
-- 7. reviews - Đánh giá sản phẩm
-- 8. coupons - Mã giảm giá
-- 9. banners - Banner quảng cáo
-- 10. wishlist_items - Danh sách yêu thích
-- ============================================

