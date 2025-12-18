# Database Setup

This folder contains SQL scripts and helpers for the e-commerce database.

## Files
- `create_database.sql` – create database/user with sane defaults
- `ecommerce_tables_v2.sql` – core schema (products, orders, payments, wishlist, etc.)
- `add-support-conversations.sql` – adds support conversations/messages tables
- `add-order-messages.sql` – adds order_messages table
- `create-admin.sql` – seed an admin user directly via SQL
- `insert-products-with-images.sql` – sample products with images
- `reset_database.sql` – drop and recreate the schema
- `setup_database.bat` / `setup_database.sh` – automated setup helpers
- `fix-category-name.sql`, `update-banners-fashion-2025.sql`, `update-products-clothing-only.sql` – maintenance scripts

## Quick setup (recommended)
Windows:
```bash
cd database
./setup_database.bat
```

Linux/Mac:
```bash
cd database
chmod +x setup_database.sh
./setup_database.sh
```

## Manual setup
1) Create database and user
```bash
mysql -u root -p < database/create_database.sql
```

2) Create schema
```bash
mysql -u root -p ecommerce < database/ecommerce_tables_v2.sql
mysql -u root -p ecommerce < database/add-support-conversations.sql
mysql -u root -p ecommerce < database/add-order-messages.sql
```

3) Optional: sample data / fixes
```bash
mysql -u root -p ecommerce < database/insert-products-with-images.sql
mysql -u root -p ecommerce < database/fix-category-name.sql
mysql -u root -p ecommerce < database/update-banners-fashion-2025.sql
mysql -u root -p ecommerce < database/update-products-clothing-only.sql
```

4) Optional: create admin by SQL (alternative to `npm run seed:admin`)
```bash
mysql -u root -p ecommerce < database/create-admin.sql
```

## Connection settings
- Host: `localhost`
- Port: `3306`
- Database: `ecommerce`
- User: `ecommerce_user`
- Password: `ecommerce_pass`
- Charset/Collation: `utf8mb4` / `utf8mb4_unicode_ci`

Example env values:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=ecommerce_user
DB_PASSWORD=ecommerce_pass
DB_NAME=ecommerce
```
Or a single URL:
```
DATABASE_URL=mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce
```

## Reset database
```bash
mysql -u root -p < database/reset_database.sql
```
Then re-run the schema scripts above.

## Notes
- Scripts target MySQL 8.0+. All tables use `utf8mb4` for full Unicode support.
- Support/Order message tables are separate migrations; run them after the base schema.
- Change default passwords before deploying to production. Use environment variables instead of hardcoding secrets.
