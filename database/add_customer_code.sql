-- Migration: Add customerCode column to clients table
-- Compatible with MySQL 5.7+

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'customerCode'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE clients ADD COLUMN customerCode VARCHAR(20) NULL UNIQUE AFTER role',
  'SELECT ''Column customerCode already exists, skipping.'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill existing clients that have no code
UPDATE clients
SET customerCode = CONCAT('KH', LPAD(id, 6, '0'))
WHERE customerCode IS NULL OR customerCode = '';
