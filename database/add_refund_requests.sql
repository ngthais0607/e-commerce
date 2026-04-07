-- Migration: Add refund_requests table

CREATE TABLE IF NOT EXISTS refund_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  clientId INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  adminNote TEXT NULL,
  requestedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolvedAt DATETIME(3) NULL,
  INDEX idx_orderId (orderId),
  INDEX idx_clientId (clientId),
  INDEX idx_status (status),
  CONSTRAINT fk_refund_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_client FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
