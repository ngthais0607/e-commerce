-- ============================================
-- Schema optimizations (run once after ecommerce_full_schema.sql)
-- - Add missing FK: order_messages.staffId → clients
-- - Add banners.description for frontend
-- - Add indexes for common query patterns
-- If you re-run: skip ALTER/ADD/CREATE that already exist (errors are safe to ignore).
-- ============================================

USE ecommerce;

-- 1. Order messages: FK staffId → clients (staff is a client with role STAFF/ADMIN)
ALTER TABLE order_messages
  ADD CONSTRAINT fk_order_messages_staff
  FOREIGN KEY (staffId) REFERENCES clients(id) ON DELETE SET NULL;

-- 2. Banners: add description (used by admin UI). Skip if column already exists.
ALTER TABLE banners
  ADD COLUMN description TEXT NULL AFTER link;

-- 3. Indexes for common queries (ignore error if index already exists)
-- Admin orders list: filter by status + sort by createdAt
CREATE INDEX idx_orders_status_createdAt ON orders(status, createdAt DESC);
CREATE INDEX idx_orders_paymentStatus ON orders(paymentStatus);
CREATE INDEX idx_payments_order_status ON payments(order_id, status);
CREATE INDEX idx_order_items_order_product ON order_items(orderId, productId);
