## Workflow tổng quan

- **Kiến trúc**: FE React/Vite (`apps/web`) gọi REST API Express (`apps/api`) qua `VITE_API_URL` (mặc định `/api`). BE kết nối MySQL (schema trong `database/*.sql`), tùy chọn Redis cache. Socket.io dùng cho chat hỗ trợ nếu bật.
- **Luồng chuẩn**: Browser → FE (router, state) → API (`/api/...`) → middleware (auth, rate limit, logger, validate) → controller → service/model → MySQL/Redis/email/payment → JSON response → FE cập nhật UI/store, hiển thị toast/error.
- **Error/Logging**: middleware `errorHandler` trả format lỗi chung; `requestLogger` + `winston` log request/lỗi; FE xử lý lỗi tập trung tại `services/api.ts`, show toast.

## Luồng người dùng (Customer)

1) **Duyệt & tìm kiếm sản phẩm**
   - FE: `HomePage`/`ShopPage` gọi `/api/products` với query (filter/sort/pagination).
   - BE: cache (nếu Redis), query MySQL `products` + `categories`, trả danh sách + meta.
2) **Xem chi tiết sản phẩm**
   - FE: `ProductDetailPage` gọi `/api/products/:slug`, hiển thị ảnh/giá/stock/reviews.
   - BE: lấy product, liên quan (category/brand), review summary.
3) **Giỏ hàng**
   - FE: thêm vào `cartStore`; có thể sync server nếu bật.
   - FE hiển thị subtotal, áp dụng coupon (gọi BE để validate).
4) **Thanh toán / Checkout**
   - FE: `CheckoutPage` gửi địa chỉ, giỏ hàng, coupon tới `/api/orders`.
   - BE: validate tồn kho, tính phí ship/discount, tạo `orders` + `order_items`, áp dụng coupon, tạo payment record.
   - BE trả URL/flow thanh toán (VNPay/Stripe hoặc mock). FE redirect/mở `MockPaymentPage`.
   - Sau thanh toán: FE chuyển `PaymentSuccessPage`/`PaymentFailedPage`, gọi API xác nhận; BE cập nhật `orders.status/paymentStatus`, thêm `order_messages` nếu cần.
5) **Theo dõi đơn / lịch sử**
   - FE: `OrderHistoryPage`, `OrderDetailPage` gọi `/api/orders` / `/api/orders/:id`.
   - BE: trả đơn theo `clientId`, trạng thái, kèm items/payments/messages.
6) **Đánh giá sản phẩm**
   - FE: form review, validate với Zod, POST `/api/reviews`.
   - BE: enforce unique (client, product), cập nhật `products.rating/reviewCount`.
7) **Hỗ trợ / Chat**
   - FE: mở socket (`lib/socket.ts`, `components/chat`), join theo `support_conversation_id`.
   - BE: socket handler lưu `support_messages` vào DB, broadcast lại; REST fallback qua `/api/support`.

## Luồng quản trị (Admin/Staff)

1) **Đăng nhập admin**
   - FE admin layout; BE `/api/auth/login` với role `ADMIN/STAFF`; JWT lưu tại FE.
2) **Dashboard & thống kê**
   - FE gọi các endpoint stats (doanh thu, đơn theo trạng thái, sản phẩm bán chạy).
   - BE truy vấn aggregate từ `orders`, `order_items`, `payments`.
3) **Quản lý sản phẩm/danh mục/banner**
   - CRUD qua `/api/admin/products|categories|banners`; upload ảnh dùng `multer` + `sharp`.
4) **Quản lý đơn hàng**
   - Cập nhật trạng thái, thêm ghi chú `order_messages`, gán tracking code, xử lý refund nếu có.
5) **Quản lý người dùng/coupon**
   - Khoá/mở user, đổi role; tạo/sửa/xóa coupon, set hiệu lực/giới hạn.
6) **Hỗ trợ khách**
   - Xem danh sách `support_conversations`, trả lời qua REST hoặc socket; trạng thái conversation được cập nhật (OPEN/CLOSED).

## Luồng dữ liệu chính (BE ↔ DB)

- **Auth**: `clients` + `password_reset_tokens`; JWT middleware `auth` gắn user vào request.
- **Catalog**: `categories` ←→ `products` (FK categoryId), `banners`.
- **Khuyến mãi**: `coupons` (type PERCENT/FIXED, điều kiện minOrder, maxDiscount, usageLimit).
- **Đơn hàng**: `orders` (status, paymentStatus, totals, shippingAddress JSON) ←→ `order_items`; liên kết `couponCode`; `payments` cho giao dịch; `order_messages` cho note/log.
- **Đánh giá**: `reviews` (unique client+product).
- **Hỗ trợ**: `support_conversations` ←→ `support_messages`.

## Luồng build/deploy

- **FE**: build Vite (`npm run build` tại `apps/web`), deploy tĩnh (Vercel/nginx). Config `VITE_API_URL` trỏ về BE.
- **BE**: chạy Node/Express port 4000 (dev `npm run dev:api`, prod `npm run build && npm run start:prod`), cần `.env` DB/JWT/email/Redis. Deploy Render/Railway/VPS; Redis optional.
- **DB**: MySQL 8+, chạy các script trong `database/` (`create_database.sql`, `ecommerce_tables_v2.sql`, `add-support-conversations.sql`, `add-order-messages.sql`, seed optional).

## Luồng vận hành & bảo trì

- **Seed / scripts**: trong `apps/api/scripts` (seed admin, seed products, cleanup cache, test DB).
- **Cache**: nếu Redis bật, cache catalog/banner/stats; khi không có Redis, app bỏ qua cache (graceful).
- **Giám sát**: log bằng `winston`; nên bổ sung metrics/healthcheck cho deploy thực tế.

