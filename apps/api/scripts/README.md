## API maintenance scripts

Thư mục `apps/api/scripts` chứa các script tiện ích để quản lý dữ liệu và kiểm tra hệ thống.  
Tất cả script đều chạy bằng `tsx` (xem `package.json` của API).

> **Lưu ý:** Đây là script cho môi trường dev/staging/ops, không bắt buộc phải chạy khi deploy.  
> Trước khi chạy trên production, luôn backup database.

---

### 1. Kiểm tra kết nối DB

- **File**: `test-db-connection.js`  
- **Lệnh**:
  ```bash
  cd apps/api
  npm run db:test
  ```
- **Mục đích**: kiểm tra nhanh kết nối MySQL và in ra thông tin version, database hiện tại; gợi ý chạy `setup_database` nếu DB chưa tồn tại.

---

### 2. Seed / dữ liệu demo

- **Seed admin**  
  - **File**: `seed-admin.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run seed:admin
    ```
  - **Mục đích**: tạo tài khoản admin mặc định (email/password lấy từ biến môi trường hoặc giá trị mặc định trong script).

- **Seed test users**  
  - **File**: `seed-test-users.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run seed:test-users
    ```
  - **Mục đích**: thêm một số user test vào bảng `clients` để dễ thử nghiệm frontend.

- **Seed products demo**  
  - **File**: `seed-products.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run seed:products
    ```
  - **Mục đích**: thêm dữ liệu sản phẩm mẫu phục vụ hiển thị trang shop.

---

### 3. Bảo trì / dọn dẹp dữ liệu

- **Clear rate limit**  
  - **File**: `clear-rate-limit.ts`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run clear:rate-limit
    ```
  - **Mục đích**: xóa dữ liệu giới hạn request (rate limit) trong Redis/MySQL (tùy config) khi cần reset.

- **Clear cache**  
  - **File**: `clear-cache.ts`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run clear:cache
    ```
  - **Mục đích**: xóa cache (Redis, nếu dùng) cho các key chính trong hệ thống.

- **Migrate addresses from orders**  
  - **File**: `migrate-addresses-from-orders.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run migrate:addresses
    ```
  - **Mục đích**: đọc địa chỉ shipping từ bảng `orders` và đổ sang bảng `addresses` theo client, dùng khi nâng cấp schema.

- **Cleanup wishlist**  
  - **File**: `cleanup-wishlist.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run cleanup:wishlist
    ```
  - **Mục đích**: dọn dẹp dữ liệu wishlist không hợp lệ (ví dụ sản phẩm đã bị xóa).

---

### 4. Script cập nhật dữ liệu fashion 2025

- **Update banners Fashion 2025**  
  - **File**: `update-banners-fashion-2025.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run update:banners-fashion
    ```
  - **Mục đích**: xóa banner homepage cũ và thêm bộ banner Fashion 2025, đồng bộ với `update-banners-fashion-2025.sql`.

- **Update products clothing**  
  - **File**: `update-products-clothing.js`  
  - **Lệnh**:
    ```bash
    cd apps/api
    npm run update:products-clothing
    ```
  - **Mục đích**: cập nhật dữ liệu sản phẩm theo chủ đề thời trang/quần áo (clothing).

---

### 5. Gợi ý sử dụng

- **Local/dev**:
  - Dùng `setup_database.(bat|sh)` để tạo schema + data cơ bản.
  - Chạy `npm run seed:admin` và `npm run seed:products` để có admin và sản phẩm mẫu.
  - Tùy nhu cầu, chạy thêm script update banners/products.

- **Production**:
  - Chỉ chạy những script cần thiết, sau khi đã backup DB và kiểm tra trên staging.

