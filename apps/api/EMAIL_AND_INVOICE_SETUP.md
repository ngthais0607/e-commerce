## Email & Hóa đơn thanh toán

Tài liệu này hướng dẫn cấu hình email cho API và mô tả cách hệ thống gửi **hóa đơn / payment receipt** cho khách sau khi thanh toán thành công.

---

### 1. Luồng gửi email trong hệ thống

- **Xác nhận đơn hàng (Order Confirmation)**  
  - Được gửi ngay sau khi khách tạo đơn (`createOrder`).  
  - Gửi tới: **email của khách** (`user.email`).  
  - Nội dung: thông tin đơn, danh sách sản phẩm, tổng tiền, trạng thái đơn hiện tại.

- **Hóa đơn thanh toán (Payment Receipt / Invoice)**  
  - Được gửi **sau khi thanh toán thành công** (VNPay callback hoặc mock payment).  
  - Hàm `PaymentService.updatePaymentStatus(orderId, 'PAID', transactionId)`:
    - Cập nhật `payments` và `orders.paymentStatus / status`.  
    - Nếu trạng thái mới là `PAID` và trước đó **chưa** `PAID`, sẽ:
      - Lấy chi tiết đơn qua `userOrderModel.getById(orderId)`.  
      - Gửi email qua `sendPaymentReceipt(order, transactionId)`.  
  - Gửi tới: **email của khách** (ưu tiên `order.user.email`, fallback `order.email`).  
  - Nội dung: thông tin thanh toán, danh sách sản phẩm, tổng tiền, transaction ID (nếu có).

> Lưu ý: Hệ thống **không gửi bản sao** hóa đơn/đơn hàng về email của shop.  
> SMTP Gmail chỉ dùng làm **tài khoản gửi** (FROM), không phải nơi nhận.

---

### 2. Cấu hình Gmail SMTP trong `.env`

File mẫu: `apps/api/.env.example` đã được chuẩn hóa cho Gmail.

1. **Bật 2-Step Verification cho tài khoản Gmail**
   - Vào `https://myaccount.google.com/` → **Security**.  
   - Bật **2-Step Verification** (Xác minh 2 bước).

2. **Tạo App Password cho Gmail**
   - Trong phần **Security** → **App passwords**.  
   - App: chọn `Mail`.  
   - Device: chọn `Other (Custom name)` → nhập `E-Commerce API` (tùy ý).  
   - Nhấn **Generate**, copy chuỗi 16 ký tự (App password).

3. **Tạo / sửa file `.env` cho API**
   - Từ root project:
     ```bash
     cd apps/api
     cp .env.example .env   # nếu chưa có .env
     ```
   - Mở `apps/api/.env` và chỉnh:

     ```env
     # Email (Gmail SMTP)
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your_email@gmail.com          # Gmail dùng để gửi mail
     SMTP_PASS=your_gmail_app_password      # App password 16 ký tự
     SMTP_FROM="Your Shop Name <your_email@gmail.com>"

     # URL của frontend dùng trong link và redirect
     FRONTEND_URL=http://localhost:5173      # đổi thành domain thật khi deploy
     ```

4. **Khởi động lại API**
   - Dev:
     ```bash
     cd apps/api
     npm run dev
     ```
   - Prod:
     ```bash
     cd apps/api
     npm run build
     npm run start:prod
     ```

---

### 3. Kiểm tra tính năng gửi hóa đơn

1. **Kiểm tra gửi email nói chung**
   - Đăng ký tài khoản khách bằng email thật.  
   - Tạo đơn hàng mới trên frontend (checkout).  
   - Sau khi tạo đơn, kiểm tra:
     - Hộp thư của khách: có email **Order Confirmation**.  
     - Log API: dòng `Email sent successfully`.

2. **Kiểm tra gửi hóa đơn sau thanh toán**
   - Tạo đơn hàng mới với phương thức thanh toán online (VNPay / mock).  
   - Thực hiện thanh toán:
     - Với VNPay: để flow callback chạy đến `/payment/callback`.  
     - Với mock: gọi endpoint mock payment (ví dụ `/api/client/payment/mock-success`).  
   - Sau khi thanh toán thành công:
     - Kiểm tra hộp thư khách: có email **"Payment Receipt - <OrderNumber>"**.  
     - Kiểm tra DB:
       - Bảng `orders`: `paymentStatus = 'PAID'`, `status = 'PAID'` (nếu trước đó là `PENDING`).  
       - Bảng `payments`: có bản ghi tương ứng với `order_id` và `status = 'PAID'`.

3. **Xử lý lỗi thường gặp**
   - **Không thấy email gửi đi**:
     - Kiểm tra log API: nếu có `Email transporter not available` → thiếu/ sai `SMTP_*` trong `.env`.  
     - Kiểm tra có restart API sau khi sửa `.env` hay chưa.
   - **Gmail chặn đăng nhập**:
     - Đảm bảo đang dùng **App Password**, không dùng mật khẩu thường.  
     - Kiểm tra xem 2-Step Verification đã bật chưa.

---

### 4. Redis (tùy chọn)

Redis dùng để **cache** (sản phẩm, danh mục) giúp API nhanh hơn. **Không bắt buộc**: nếu không cấu hình, API vẫn chạy bình thường, chỉ không dùng cache.

#### Cách hoạt động

- **Khởi động:** Trong `index.ts`, sau khi kết nối DB thành công, server gọi `initRedis()`. Nếu `REDIS_URL` trống hoặc `DISABLE_REDIS=1` → Redis bị bỏ qua, log: *"Redis disabled ... Running without cache."*. Nếu có `REDIS_URL` nhưng không kết nối được (dev) → log cảnh báo và chạy tiếp không cache; (production) → có thể throw.
- **Health check:** `GET /health` gọi `pingRedis()`. Response có `redis: "ok"` hoặc `redis: "unavailable"`. Trạng thái 503 chỉ khi **database** lỗi, không phải Redis.
- **Cache:** `src/utils/cache.ts` cung cấp `getCache`, `setCache`, `deleteCache`, `deleteCachePattern`, `cacheWrapper`. Hiện cache được dùng trong **product** và **category** (admin model) để cache danh sách / chi tiết.
- **Xóa cache thủ công:** Script `apps/api/scripts/clear-cache.ts` (ví dụ: `npx tsx scripts/clear-cache.ts`) kết nối Redis và xóa các key `products:*`, `product:*`.

#### Cài và chạy Redis (không dùng Docker)

- **Windows:** Dùng WSL rồi `sudo apt install redis-server`, hoặc cài [Redis for Windows](https://github.com/microsoftarchive/redis/releases) / [Memurai](https://www.memurai.com/) (tương thích Redis).
- **Mac:** `brew install redis` → chạy nền: `brew services start redis` hoặc tạm thời: `redis-server`.
- **Linux:** `sudo apt install redis-server` (Ubuntu/Debian) hoặc tương đương.

Sau khi cài, chạy Redis (mặc định port 6379):

```bash
redis-server
```

Giữ terminal này mở hoặc chạy Redis như service (tùy OS).

#### Cấu hình trong `.env`

Trong `apps/api/.env` (copy từ `.env.example` nếu chưa có):

```env
# Bật Redis (localhost:6379)
REDIS_URL=redis://localhost:6379

# Muốn tắt cache: bỏ trống REDIS_URL hoặc set
# DISABLE_REDIS=1
```

- **Local:** Cài và chạy Redis như trên, set `REDIS_URL=redis://localhost:6379`.
- **Production:** Dùng Redis managed (Redis Cloud, ElastiCache, …), set `REDIS_URL` theo URL họ cung cấp. Không dùng cache thì để trống `REDIS_URL` hoặc set `DISABLE_REDIS=1`.

