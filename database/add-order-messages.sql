-- ============================================
-- Migration: Add order_messages table for internal staff-customer chat
-- ============================================

USE ecommerce;

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


