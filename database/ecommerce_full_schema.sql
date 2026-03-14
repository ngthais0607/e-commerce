-- ============================================
-- Full schema for E-Commerce project
--   - Creates database `ecommerce`
--   - Core tables (clients, products, orders, payments, coupons, etc.)
--   - Support tables (order_messages, support_conversations, support_messages)
-- Source: merged from ecommerce_tables_v2.sql, add-order-messages.sql, add-support-conversations.sql
-- ============================================

-- 1. Create database
CREATE DATABASE IF NOT EXISTS ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE ecommerce;

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
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

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt DATETIME(3) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_token (token),
    INDEX idx_clientId (clientId),
    INDEX idx_token_expiresAt_used (token, expiresAt, used),
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
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
    INDEX idx_clientId (clientId),
    INDEX idx_clientId_isDefault (clientId, isDefault),
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
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

-- Products
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

-- Coupons
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

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderNumber VARCHAR(100) NOT NULL UNIQUE,
    clientId INT NOT NULL,
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
    INDEX idx_clientId (clientId),
    INDEX idx_status (status),
    INDEX idx_orderNumber (orderNumber),
    INDEX idx_clientId_status (clientId, status),
    INDEX idx_createdAt (createdAt),
    INDEX idx_paymentStatus (paymentStatus),
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (couponCode) REFERENCES coupons(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'VNPAY',
    status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255) NULL,
    transaction_ref VARCHAR(255) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_transaction_id (transaction_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items
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

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
    productId INT NOT NULL,
    rating INT NOT NULL,
    title VARCHAR(255) NULL,
    comment TEXT NULL,
    isVerified BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY unique_client_product (clientId, productId),
    INDEX idx_productId (productId),
    INDEX idx_clientId (clientId),
    INDEX idx_productId_rating (productId, rating),
    INDEX idx_createdAt (createdAt),
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banners
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

-- ============================================
-- 3. SUPPORT / MESSAGING TABLES
-- ============================================

-- Order messages (internal chat per order)
CREATE TABLE IF NOT EXISTS order_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  clientId INT NULL,
  staffId INT NULL,
  senderRole ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL,
  message TEXT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_orderId_createdAt (orderId, createdAt),
  INDEX idx_clientId (clientId),
  INDEX idx_staffId (staffId),
  CONSTRAINT fk_order_messages_order
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_messages_client
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support conversations
CREATE TABLE IF NOT EXISTS support_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  status ENUM('OPEN', 'ASSIGNED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  assignedStaffId INT NULL,
  lastMessageAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (userId),
  INDEX idx_status (status),
  INDEX idx_assigned (assignedStaffId),
  CONSTRAINT fk_support_user FOREIGN KEY (userId) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_support_staff FOREIGN KEY (assignedStaffId) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderRole ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL,
  userId INT NULL,
  staffId INT NULL,
  message TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation (conversationId),
  INDEX idx_senderRole (senderRole),
  CONSTRAINT fk_support_conv FOREIGN KEY (conversationId) REFERENCES support_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_msg_user FOREIGN KEY (userId) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_support_msg_staff FOREIGN KEY (staffId) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- END
-- ============================================


