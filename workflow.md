# WORKFLOW DỰ ÁN E-COMMERCE

## 🏗️ Kiến trúc tổng quan

- **Frontend**: React + TypeScript + Vite (`apps/web`)
  - State management: Zustand (auth, cart)
  - UI: Tailwind CSS + shadcn/ui components
  - Routing: React Router v6
  - API client: Axios với interceptors

- **Backend**: Node.js + Express + TypeScript (`apps/api`)
  - Database: MySQL 8+ với connection pooling
  - Cache: Redis (optional, graceful degradation)
  - Realtime: Socket.IO cho chat và order messages
  - Authentication: JWT với refresh tokens
  - Validation: Zod schemas
  - File upload: Multer + Sharp (image processing)

- **Luồng chuẩn**: 
  ```
  Browser → FE Router → API Call → Middleware (auth, rate limit, logger, validate) 
  → Controller → Service/Model → MySQL/Redis/Email/Payment → JSON Response 
  → FE Update UI/Store → Toast/Error Display
  ```

- **Error/Logging**: 
  - Backend: `errorHandler` middleware trả format lỗi chuẩn; `requestLogger` + `winston` log requests/errors
  - Frontend: Xử lý lỗi tập trung tại `services/api.ts`, hiển thị toast notifications

---

## 👤 Luồng người dùng (Customer)

### 1. Duyệt & Tìm kiếm sản phẩm
- **FE**: `HomePage`/`ShopPage` gọi `/api/products` với query params (filter, sort, pagination, search)
- **BE**: 
  - Kiểm tra Redis cache (TTL: 5 phút)
  - Query MySQL `products` + `categories` với filters
  - Trả danh sách sản phẩm + pagination metadata
- **Cache**: Tự động invalidate khi có thay đổi (create/update/delete product)

### 2. Xem chi tiết sản phẩm
- **FE**: `ProductDetailPage` gọi `/api/products/:slug` hoặc `/api/products/:id`
- **BE**: Lấy product details, category, brand, reviews summary, related products
- **Display**: Images gallery, price, stock, attributes, reviews, add to cart

### 3. Quản lý giỏ hàng
- **FE**: 
  - Thêm vào `cartStore` (Zustand) - local state
  - Hiển thị subtotal, shipping fee, discount
  - Áp dụng coupon: gọi `/api/coupons/validate` và `/api/coupons/apply`
- **BE**: Validate coupon code, check conditions (minOrder, maxDiscount, usageLimit)

### 4. Thanh toán / Checkout
- **FE**: `CheckoutPage`
  - Hiển thị cart items, shipping addresses
  - Form: chọn address, payment method (VNPay/MoMo/ZaloPay/Bank Transfer/COD)
  - POST `/api/orders` với order data
- **BE**: 
  - Validate inventory, calculate shipping/discount
  - Tạo `orders` + `order_items` records
  - Apply coupon, create payment record
  - Trả payment URL hoặc redirect flow
- **Payment Flow**:
  - **Online**: Redirect đến VNPay/MoMo/ZaloPay → Callback → Update order status
  - **Bank Transfer**: Hiển thị thông tin chuyển khoản, chờ admin xác nhận
  - **COD**: Tự động tạo order với status PENDING
- **After Payment**: 
  - FE chuyển đến `PaymentSuccessPage`/`PaymentFailedPage`
  - BE cập nhật `orders.status` và `orders.paymentStatus`
  - Tự động tạo `order_messages` thông báo

### 5. Theo dõi đơn hàng / Lịch sử
- **FE**: 
  - `OrderHistoryPage`: Danh sách đơn hàng với filter theo status
  - `OrderDetailPage`: Chi tiết đơn hàng, status badges, tracking code, messages
- **BE**: 
  - `/api/orders`: Trả orders theo `clientId` với filter
  - `/api/orders/:id`: Chi tiết order với items, payments, messages
- **Realtime**: Socket.IO emit events khi có thay đổi status

### 6. Đánh giá sản phẩm
- **FE**: Form review với rating (1-5 stars), comment, validate với Zod
- **BE**: 
  - POST `/api/reviews`
  - Enforce unique (clientId, productId)
  - Cập nhật `products.rating` và `products.reviewCount`

### 7. Quản lý địa chỉ
- **FE**: `AccountPage` - quản lý shipping addresses
- **BE**: `/api/addresses` - CRUD operations với ownership check
- **Features**: Set default address, validate format

### 8. Hỗ trợ / Chat
- **FE**: 
  - Mở Socket.IO connection (`lib/socket.ts`)
  - Join room theo `support_conversation_id`
  - UI: `components/chat/SupportBot.tsx`
- **BE**: 
  - Socket handler lưu `support_messages` vào DB
  - Broadcast messages đến client và staff
  - REST fallback qua `/api/support` endpoints

---

## 👨‍💼 Luồng quản trị (Admin)

### 1. Đăng nhập Admin
- **FE**: `LoginPage` với role check
- **BE**: `/api/auth/login` với role `ADMIN` hoặc `STAFF`
- **Auth**: JWT token lưu trong Zustand store, attach vào headers

### 2. Dashboard & Thống kê
- **FE**: `AdminDashboard` gọi `/api/admin/statistics/*`
- **BE**: 
  - Aggregate queries từ `orders`, `order_items`, `payments`
  - Tính doanh thu, số đơn theo trạng thái, top products
  - Cache stats nếu có Redis

### 3. Quản lý sản phẩm
- **CRUD**: `/api/admin/products`
  - Create/Update: Upload images với `multer` + `sharp` (resize, optimize)
  - Delete: Soft delete hoặc hard delete
  - Cache: Tự động invalidate khi có thay đổi

### 4. Quản lý danh mục
- **CRUD**: `/api/admin/categories`
- **Features**: Hierarchical categories (parent/child), image upload

### 5. Quản lý đơn hàng
- **View**: `/api/admin/orders` - danh sách với filters
- **Update Status**: 
  - **Admin**: Có thể thay đổi tất cả trạng thái (PENDING, PAID, PROCESSING, SHIPPED, COMPLETED, CANCELLED)
  - **Staff**: Có thể thay đổi sang PROCESSING, SHIPPED, COMPLETED, CANCELLED (trừ đơn đã SHIPPED/COMPLETED)
- **Payment Status**: Chỉ Admin có thể thay đổi
- **Tracking Code**: Admin và Staff đều có thể cập nhật
- **Messages**: Tự động tạo `order_messages` khi thay đổi status
- **Email**: Tự động gửi email thông báo khi thay đổi status

### 6. Quản lý người dùng
- **View**: `/api/admin/users` - danh sách users với search/filter
- **Update**: Thay đổi role (CUSTOMER/ADMIN/STAFF), active/inactive status

### 7. Quản lý địa chỉ khách hàng
- **View**: `/api/admin/addresses` - xem tất cả shipping addresses
- **Filter**: Theo user ID
- **Delete**: Xóa address (với confirmation)

### 8. Quản lý Banner
- **CRUD**: `/api/admin/banners`
- **Features**: 
  - Upload image URL
  - Set position (homepage, category, product, sidebar)
  - Sort order, active/inactive toggle
  - Link URL (optional)

### 9. Quản lý Coupon
- **CRUD**: `/api/admin/coupons`
- **Features**: 
  - Type: PERCENT hoặc FIXED
  - Conditions: minOrder, maxDiscount, usageLimit
  - Validity: validFrom, validUntil
  - Track usage count

### 10. Hỗ trợ khách hàng
- **View**: `/api/admin/support/conversations` - danh sách conversations
- **Actions**: 
  - Claim conversation (assign to staff)
  - Close conversation
  - Send messages (REST hoặc Socket.IO)
- **Realtime**: Socket.IO cho instant messaging

---

## 👔 Luồng quản trị (Staff)

### Quyền hạn Staff:

**✅ Staff CÓ THỂ:**
1. **Quản lý đơn hàng**:
   - Xem tất cả đơn hàng
   - Cập nhật trạng thái: PROCESSING, SHIPPED, COMPLETED, **CANCELLED**
   - Cập nhật tracking code
   - Gửi messages cho đơn hàng
   - **Lưu ý**: Không thể cancel đơn đã SHIPPED hoặc COMPLETED

2. **Quản lý Banner**:
   - Xem, tạo, sửa, xóa banners
   - Upload images, set position, sort order

3. **Quản lý địa chỉ**:
   - Xem tất cả shipping addresses của customers
   - Xóa addresses (với confirmation)
   - Filter theo user

4. **Support Chat**:
   - Xem và trả lời conversations
   - Claim và close conversations
   - Realtime messaging với Socket.IO

5. **Dashboard**:
   - Xem staff dashboard với statistics
   - Xem orders assigned

**❌ Staff KHÔNG THỂ:**
- Quản lý products, categories, coupons, users
- Thay đổi payment status
- Thay đổi trạng thái đơn hàng ngược lại (trừ cancel)
- Cancel đơn đã SHIPPED hoặc COMPLETED

### Workflow Staff:

1. **Xử lý đơn hàng**:
   - Xem danh sách đơn → Chọn đơn cần xử lý
   - Cập nhật status: PENDING/PAID → PROCESSING → SHIPPED → COMPLETED
   - Nhập tracking code khi chuyển sang SHIPPED
   - Cancel đơn nếu cần (trừ đơn đã shipped/completed)
   - Gửi message thông báo cho customer

2. **Quản lý Banner**:
   - Tạo/sửa banners cho homepage, category pages
   - Set active/inactive, sort order

3. **Hỗ trợ khách**:
   - Xem conversations → Claim → Trả lời → Close
   - Realtime chat với customers

---

## 🔄 Luồng dữ liệu chính (BE ↔ DB)

### Authentication & Users
- **Tables**: `clients` (users), `password_reset_tokens`
- **Flow**: Login → JWT token → Middleware `authenticate` → Attach user to request
- **Roles**: CUSTOMER, ADMIN, STAFF

### Catalog
- **Tables**: `categories`, `products` (FK: categoryId), `banners`
- **Relations**: Category → Products (one-to-many)
- **Cache**: Products và categories cached trong Redis (TTL: 5 phút)

### Promotions
- **Tables**: `coupons`
- **Fields**: type (PERCENT/FIXED), value, minOrder, maxDiscount, usageLimit, validFrom, validUntil
- **Validation**: Check conditions trước khi apply

### Orders
- **Tables**: 
  - `orders`: status, paymentStatus, totals, shippingAddress (JSON), trackingCode
  - `order_items`: product details, quantity, price
  - `payments`: payment method, transaction ID, status
  - `order_messages`: status updates, notes
- **Relations**: Order → OrderItems (one-to-many), Order → Payment (one-to-one), Order → Messages (one-to-many)
- **Status Flow**: PENDING → PAID → PROCESSING → SHIPPED → COMPLETED (hoặc CANCELLED)

### Addresses
- **Tables**: `addresses`
- **Fields**: clientId, name, phone, address, city, district, ward, postalCode, isDefault
- **Mapping**: Database dùng `clientId`, API trả về `userId` (mapped trong view)

### Reviews
- **Tables**: `reviews`
- **Constraints**: Unique (clientId, productId)
- **Updates**: Auto-update product rating và reviewCount

### Support
- **Tables**: `support_conversations`, `support_messages`
- **Relations**: Conversation → Messages (one-to-many)
- **Realtime**: Socket.IO rooms theo conversation ID

---

## 🚀 Luồng Build & Deploy

### Frontend (apps/web)
```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Deploy
# - Static files: Deploy to Vercel/Netlify/nginx
# - Config VITE_API_URL trỏ về backend API
```

### Backend (apps/api)
```bash
# Development
npm run dev:api

# Build TypeScript
npm run build

# Production
npm run start:prod

# Type check
npm run type-check

# Deploy
# - Node.js server: Deploy to Render/Railway/VPS
# - Cần .env với DB, JWT, email, Redis configs
# - Redis optional (graceful degradation)
```

### Database
```bash
# Setup
1. Tạo database MySQL
2. Chạy scripts trong database/:
   - create_database.sql
   - ecommerce_full_schema.sql
   - (Optional) seed scripts

# Scripts có sẵn:
- apps/api/scripts/seed-admin.js
- apps/api/scripts/seed-products.js
- apps/api/scripts/test-db-connection.js
```

### Environment Variables
- **Backend**: Copy `apps/api/env.example` → `.env`
- **Frontend**: Set `VITE_API_URL` trong `.env` hoặc build config
- **Required**: DATABASE_URL, JWT_SECRET (production)
- **Optional**: REDIS_URL, SMTP config, Payment gateway configs

---

## 🔧 Luồng vận hành & Bảo trì

### Cache Management
- **Redis**: Cache products, categories, stats
- **TTL**: 5 phút cho products/categories
- **Invalidation**: Tự động xóa cache khi có thay đổi (create/update/delete)
- **Graceful Degradation**: App vẫn chạy được khi không có Redis

### Logging & Monitoring
- **Backend**: Winston logger với levels (error, warn, info, debug)
- **Request Logging**: Middleware log tất cả requests
- **Error Tracking**: Centralized error handler
- **Health Check**: `/health` endpoint

### Maintenance Scripts
- **Location**: `apps/api/scripts/`
- **Available**:
  - `seed-admin.js`: Tạo admin user
  - `seed-products.js`: Seed sample products
  - `clear-cache.js`: Clear Redis cache
  - `test-db-connection.js`: Test database connection

### Security
- **Authentication**: JWT với expiration
- **Password**: bcryptjs (12 salt rounds)
- **SQL Injection**: Prepared statements
- **Rate Limiting**: 100 requests/15 phút
- **CORS**: Configured với credentials support
- **Validation**: Zod schemas cho tất cả inputs

### Performance
- **Database**: Connection pooling, query timeout
- **Cache**: Redis cho frequently accessed data
- **Image Processing**: Sharp for optimization
- **Code Splitting**: React lazy loading

---

## 📊 Order Status Workflow

### Status Flow
```
PENDING → PAID → PROCESSING → SHIPPED → COMPLETED
   ↓                                    ↓
CANCELLED                          CANCELLED (blocked)
```

### Rules
- **Admin**: Có thể thay đổi bất kỳ trạng thái nào
- **Staff**: 
  - Có thể forward: PENDING/PAID → PROCESSING → SHIPPED → COMPLETED
  - Có thể cancel: Từ bất kỳ trạng thái nào (trừ SHIPPED/COMPLETED)
  - Không thể backward: SHIPPED → PROCESSING (blocked)
- **Cancel Restrictions**: Không thể cancel đơn đã SHIPPED hoặc COMPLETED

### Payment Status
- **Flow**: PENDING → PAID → REFUNDED (nếu cần)
- **Update**: Chỉ Admin có thể thay đổi payment status
- **Validation**: Cần transaction ID khi confirm PAID

---

## 🔐 Permission Matrix

| Feature | Customer | Staff | Admin |
|---------|----------|-------|-------|
| View Products | ✅ | ✅ | ✅ |
| Create Order | ✅ | ❌ | ❌ |
| View Own Orders | ✅ | ❌ | ❌ |
| View All Orders | ❌ | ✅ | ✅ |
| Update Order Status | ❌ | ✅* | ✅ |
| Cancel Order | ❌ | ✅* | ✅ |
| Update Payment Status | ❌ | ❌ | ✅ |
| Manage Products | ❌ | ❌ | ✅ |
| Manage Categories | ❌ | ❌ | ✅ |
| Manage Banners | ❌ | ✅ | ✅ |
| Manage Addresses | Own only | ✅ | ✅ |
| Manage Coupons | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Support Chat | ✅ | ✅ | ✅ |

*Staff: Có thể update/cancel nhưng có restrictions (không thể backward, không thể cancel shipped/completed)

---

## 🎯 Best Practices

### Code Organization
- **Backend**: MVC pattern (Models, Views, Controllers)
- **Frontend**: Component-based với hooks
- **Shared Types**: TypeScript interfaces trong `types/`
- **Validation**: Zod schemas cho type safety

### Error Handling
- **Backend**: Try-catch trong controllers, error middleware
- **Frontend**: Error boundaries, toast notifications
- **User-friendly**: Clear error messages, không expose internal errors

### Testing
- **Type Checking**: `npm run type-check` cho cả FE và BE
- **Linting**: ESLint cho code quality
- **Manual Testing**: Test flows end-to-end

### Documentation
- **API**: Swagger docs tại `/api-docs`
- **Code**: JSDoc comments cho functions
- **README**: Setup instructions

---

## 📝 Notes

- **Redis**: Optional nhưng khuyến nghị cho production
- **Email**: Cần SMTP config để sử dụng password reset
- **Payment Gateways**: Cần config keys trong .env
- **File Uploads**: Đảm bảo thư mục `uploads/` có quyền ghi
- **Database**: MySQL 8+ required, run migrations từ `database/` folder

---

**Last Updated**: Based on latest project state with Staff permissions, Banner management, and Address management features.
