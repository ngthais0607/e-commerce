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

