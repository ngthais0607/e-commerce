-- ============================================
-- Additional indexes for pagination & list queries
-- Run after ecommerce_full_schema.sql (and optionally ecommerce_schema_optimizations.sql).
-- Safe to re-run: ignore "Duplicate key name" if index already exists.
-- ============================================

USE ecommerce;

-- Orders: client order history (listByUser) – filter by clientId, sort by createdAt
CREATE INDEX idx_orders_clientId_createdAt ON orders(clientId, createdAt DESC);

-- Products: lookup by slug when active (product detail by slug)
CREATE INDEX idx_products_slug_isActive ON products(slug, isActive);
