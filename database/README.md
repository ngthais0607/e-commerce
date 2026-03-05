## Database schema

- **Database**: `ecommerce` (MySQL 8+, utf8mb4\_unicode\_ci).
- **Core bảng**:
  - `clients` ↔ `addresses`, `orders`, `reviews`, `password_reset_tokens`, `support_conversations`, `support_messages`, `order_messages.clientId`.
  - `categories` (cây danh mục qua `parentId`) ↔ `products.categoryId`.
  - `products` ↔ `order_items.productId`, `reviews.productId`.
  - `coupons` ↔ `orders.couponCode`.
  - `orders` ↔ `order_items.orderId`, `payments.order_id`, `order_messages.orderId`.
  - `support_conversations` ↔ `support_messages.conversationId`.

### Quan hệ chính

- **Client → Orders**: 1-n  
  `orders.clientId` FK `clients.id` (RESTRICT).
- **Client → Addresses**: 1-n  
  `addresses.clientId` FK `clients.id` (CASCADE).
- **Client → Reviews**: 1-n, mỗi client chỉ đánh giá 1 product 1 lần  
  UNIQUE `(clientId, productId)` trên bảng `reviews`.
- **Category tự tham chiếu**: 1-n  
  `categories.parentId` FK `categories.id` (SET NULL).
- **Category → Products**: 1-n  
  `products.categoryId` FK `categories.id` (RESTRICT).
- **Order → OrderItems**: 1-n  
  `order_items.orderId` FK `orders.id` (CASCADE).
- **Order → Payments**: 1-1/n  
  `payments.order_id` FK `orders.id` (RESTRICT), service luôn lấy bản ghi mới nhất.
- **Order → Messages**: 1-n  
  `order_messages.orderId` FK `orders.id` (CASCADE).
- **Support**:
  - `support_conversations.userId` FK `clients.id`.
  - `support_conversations.assignedStaffId` FK `clients.id`.
  - `support_messages.userId` / `staffId` FK `clients.id`.

### Index tối ưu truy vấn

- `orders`:  
  - `idx_clientId`, `idx_clientId_status` phục vụ lịch sử đơn của user.  
  - `idx_status`, `idx_createdAt`, `idx_paymentStatus` cho màn quản trị lọc/truy vấn nhanh.  
- `products`:  
  - `idx_categoryId`, `idx_categoryId_isActive` cho listing theo danh mục.  
  - `idx_slug`, `idx_brand`, `idx_createdAt`, `idx_rating` cho SEO, filter/sort.  
- `coupons`:  
  - `idx_isActive`, `idx_isActive_validFrom_validUntil` cho kiểm tra coupon hợp lệ.  
- `reviews`:  
  - `idx_productId`, `idx_productId_rating`, `idx_createdAt` cho hiển thị review sản phẩm.  
- `payments`:  
  - `idx_order_id`, `idx_status`, `idx_transaction_id` cho tra soát thanh toán.  
- `order_items`:  
  - `idx_orderId`, `idx_productId` cho thống kê và chi tiết đơn.  
- `order_messages`, `support_*`:  
  - Index theo `orderId`, `clientId`, `staffId`, `status`, `assignedStaffId`, `conversationId` để chat/support realtime nhanh.

### Các script schema

- `ecommerce_full_schema.sql`  
  - Tạo đầy đủ schema ban đầu (bảng + FK + index cơ bản).  
  - Chạy **một lần** trên database mới:
    ```sql
    SOURCE ecommerce_full_schema.sql;
    ```

- `ecommerce_schema_optimizations.sql`  
  - Bổ sung:
    - FK `order_messages.staffId → clients(id)` (đảm bảo staff tồn tại).  
    - Cột `banners.description` (cho Admin/FE).  
    - Một số index đề xuất phục vụ truy vấn thực tế.  
  - Chạy **sau** khi đã chạy `ecommerce_full_schema.sql`:
    ```sql
    SOURCE ecommerce_schema_optimizations.sql;
    ```
  - Nếu chạy lại nhiều lần có thể gặp lỗi “already exists” cho FK/cột/index – có thể bỏ qua hoặc chỉnh file tùy môi trường.

### Lưu ý vận hành

- Khi deploy lên môi trường mới:
  1. Tạo DB `ecommerce` với charset/collation đúng.  
  2. Chạy `ecommerce_full_schema.sql`.  
  3. Chạy `ecommerce_schema_optimizations.sql`.  
  4. Sau đó mới chạy seed admin (`npm run seed:admin`) và các script seed dữ liệu khác (nếu có).

# Database Setup

This folder contains SQL scripts and helpers for the e-commerce database.

## Files hiện có
- `ecommerce_full_schema.sql` – full schema (clients, products, orders, payments, support, v.v.).  
- `ecommerce_schema_optimizations.sql` – FK/staff, cột bổ sung và index tối ưu.  
- `insert-products-with-images.sql` – sample products với ảnh.  
- `create-admin.sql` – seed admin trực tiếp bằng SQL (thay thế/backup cho `npm run seed:admin`).  
- `update-banners-fashion-2025.sql` – cập nhật banner trang chủ theo chủ đề Fashion 2025.  
- `update-products-clothing-only.sql` – script bảo trì cho dữ liệu sản phẩm (clothing).  
- `setup_database.bat` / `setup_database.sh` – script tự động chạy các file cần thiết.

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

## Manual setup (tương đương script)
1) Tạo schema
```bash
mysql -u root -p ecommerce < database/ecommerce_full_schema.sql
mysql -u root -p ecommerce < database/ecommerce_schema_optimizations.sql
```

2) Optional: sample data / fixes
```bash
mysql -u root -p ecommerce < database/insert-products-with-images.sql
mysql -u root -p ecommerce < database/update-banners-fashion-2025.sql
mysql -u root -p ecommerce < database/update-products-clothing-only.sql
```

3) Optional: create admin bằng SQL (thay cho `npm run seed:admin`)
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
