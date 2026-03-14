#!/bin/bash
# Automated database setup for E-Commerce (Linux/Mac)
# Run from repo root: bash database/setup_database.sh
# Requires: MySQL 8+

set -e
echo "============================================"
echo "E-Commerce Database Setup"
echo "============================================"
echo ""

if ! command -v mysql &> /dev/null; then
    echo "[ERROR] MySQL not found. Install MySQL 8+ and add to PATH."
    exit 1
fi
echo "[OK] MySQL found"
echo ""

read -sp "Enter MySQL root password: " ROOT_PASSWORD
echo ""
echo ""

echo "[1/4] Creating database and base tables..."
mysql -u root -p"$ROOT_PASSWORD" < database/ecommerce_full_schema.sql

echo "[2/4] Applying optimizations and extra indexes..."
mysql -u root -p"$ROOT_PASSWORD" ecommerce < database/ecommerce_schema_optimizations.sql || true
mysql -u root -p"$ROOT_PASSWORD" ecommerce < database/add_indexes_pagination.sql || true
mysql -u root -p"$ROOT_PASSWORD" ecommerce < database/add_support_fk_cascade.sql || true

echo "[3/4] Done. Optional: seed admin and test users."
echo "  cd apps/api"
echo "  npm run seed:admin"
echo "  npm run seed:test-users"
echo ""
echo "[4/4] Optional: sample data"
echo "  mysql -u root -p ecommerce < database/insert-products-with-images.sql"
echo "  mysql -u root -p ecommerce < database/create-admin.sql"
echo ""
echo "============================================="
echo "[SUCCESS] Database setup completed."
echo "============================================="
echo "Use in apps/api/.env (root user):"
echo "  DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/ecommerce"
echo ""
