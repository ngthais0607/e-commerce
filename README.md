# E-Commerce Platform

A full-stack e-commerce application built with React + Vite, Express.js, and MySQL.

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand (State Management)
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- bcryptjs

## Features

### Customer Features
- Browse products with filters and search
- Product detail pages with reviews
- Shopping cart
- Checkout process
- User authentication (register/login)
- Order history
- Wishlist
- Address management

### Admin Features
- Product management (CRUD)
- Order management with status updates
- User management
- Coupon/promotion management
- Dashboard with statistics

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (hoặc dùng Docker)
- Docker (optional, recommended for database)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd E-Commerce
```

2. Setup Database

**Cách 1: Sử dụng scripts trong folder `database/` (Khuyến nghị)**

```bash
# Windows
database\setup_database.bat

# Linux/Mac
bash database/setup_database.sh
```

Script này sẽ tự động:
- Tạo database `ecommerce`
- Tạo user `ecommerce_user` với password `ecommerce_pass`
- Cấp quyền đầy đủ

Xem `database/README.md` để biết chi tiết.

**Cách 2: Sử dụng Docker (nếu có)**
```bash
docker-compose up -d
```

**Cách 3: Tạo thủ công bằng SQL**
```sql
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'ecommerce_pass';
GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
```

⚠️ **Lưu ý:** Bạn PHẢI tạo database trước khi chạy Prisma migrations!

3. Set up the backend
```bash
cd apps/api
npm install
cp env.example .env
# Chỉnh sửa .env với thông tin database của bạn
# DATABASE_URL="mysql://user:password@localhost:3306/ecommerce"
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

4. Set up the frontend
```bash
cd apps/web
npm install
npm run dev
```

5. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

### Default Credentials

Sau khi chạy seed script:
- **Admin**: `admin@admin.com` / `admin1`
- **Customer**: `user@user.com` / `123456`

## Project Structure

```
E-Commerce/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── controllers/  # MVC controllers (admin & user)
│   │   │   │   ├── admin/
│   │   │   │   └── user/
│   │   │   ├── models/       # Prisma data access by scope
│   │   │   │   ├── admin/
│   │   │   │   └── user/
│   │   │   ├── views/        # Response mappers (admin & user)
│   │   │   ├── routes/       # Express routers (admin & user)
│   │   │   │   ├── admin/
│   │   │   │   └── user/
│   │   │   ├── middleware/   # Auth, error handling, etc.
│   │   │   └── utils/        # Shared helpers
│   │   ├── prisma/          # Database schema and migrations
│   │   └── index.js         # Entry point
│   └── web/                 # Frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── store/      # Zustand stores
│       │   └── lib/         # Utilities and types
│       └── vite.config.ts
├── database/               # Database setup scripts (CHẠY TRƯỚC Prisma migrations!)
│   ├── README.md          # Hướng dẫn chi tiết
│   ├── create_database.sql # Script tạo database và user
│   └── setup_database.*   # Scripts tự động (Windows/Linux)
└── docker-compose.yml      # Database setup (optional)
```

### MVC Layering & Route Split

- User-facing APIs stay under `/api/<resource>` and map to `src/controllers/user`.
- Admin/Staff APIs live under `/api/admin/<resource>` and leverage `src/controllers/admin`.
- Each controller only talks to its matching `models/<scope>` file and returns data through a view helper in `views/<scope>`.
- Example:
  - `src/controllers/user/product.controller.js` → `models/user/product.model.js` → `views/user/product.view.js`
  - `src/controllers/admin/product.controller.js` → `models/admin/product.model.js` → `views/admin/product.view.js`

This keeps user flows isolated from admin dashboards while still sharing Prisma logic where it makes sense.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/admin/products` - Create product (Admin)
- `PUT /api/admin/products/:id` - Update product (Admin)
- `DELETE /api/admin/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - List current user orders
- `GET /api/orders/:id` - Get order details for current user
- `POST /api/orders` - Create order
- `GET /api/admin/orders` - List all orders (Admin)
- `GET /api/admin/orders/:id` - Get order details (Admin)
- `PUT /api/admin/orders/:id/status` - Update order status (Admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/admin/categories` - Create category (Admin)
- `PUT /api/admin/categories/:id` - Update category (Admin)
- `DELETE /api/admin/categories/:id` - Delete category (Admin)

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Coupons
- `GET /api/coupons/validate` - Validate coupon
- `POST /api/coupons/apply` - Apply coupon to cart/orders
- `GET /api/admin/coupons` - List coupons (Admin)
- `POST /api/admin/coupons` - Create coupon (Admin)
- `PUT /api/admin/coupons/:code` - Update coupon (Admin)
- `DELETE /api/admin/coupons/:code` - Delete coupon (Admin)

> **Admin endpoints** now live under `/api/admin/*` (e.g. `/api/admin/products`, `/api/admin/orders`, `/api/admin/users`), mirroring the controller/model/view folders for the admin scope.

### Database Setup

**⚠️ QUAN TRỌNG:** Folder `database/` chứa scripts để tạo database và user **TRƯỚC** khi chạy Prisma migrations.

**Tại sao cần?**
- Prisma **KHÔNG tự động tạo database**, chỉ tạo tables trong database đã có
- Cần tạo database và user trước khi Prisma có thể kết nối

**Các file trong `database/`:**
- `README.md` - Hướng dẫn chi tiết
- `create_database.sql` - Script SQL tạo database và user
- `setup_database.bat` / `.sh` - Scripts tự động (Windows/Linux)

**Cách sử dụng:**
1. Chạy script setup: `database\setup_database.bat` (Windows) hoặc `bash database/setup_database.sh` (Linux/Mac)
2. Cấu hình `DATABASE_URL` trong `apps/api/.env`
3. Chạy Prisma migrations: `npx prisma migrate dev`

Xem `database/README.md` để biết chi tiết.

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Addresses
- `GET /api/addresses` - List addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Users
- `PUT /api/users/profile` - Update current user profile
- `GET /api/admin/users` - List users (Admin)
- `GET /api/admin/users/:id` - Get user detail (Admin)
- `PUT /api/admin/users/:id` - Update role/status (Admin)

## Development

### Running in Development Mode

From the root directory:
```bash
npm run dev
```

This will start both the API and web servers concurrently.

### Database Connection với Prisma

### ⚠️ Quan Trọng: Không cần kết nối MySQL thủ công!

**Prisma tự động quản lý kết nối MySQL** thông qua connection string trong file `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
```

Prisma sẽ:
- ✅ Tự động tạo connection pool
- ✅ Quản lý kết nối hiệu quả
- ✅ Tự động reconnect khi mất kết nối
- ✅ Đóng connection đúng cách khi app shutdown

**Chỉ cần:**
1. Cấu hình `DATABASE_URL` trong `.env`
2. Chạy `npx prisma generate` để tạo Prisma Client
3. Sử dụng `prisma` trong code - không cần kết nối thủ công!

### Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client

```bash
cd apps/api
npx prisma generate
```

### Prisma Studio (GUI để xem database)

```bash
cd apps/api
npx prisma studio
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive routes
- Input validation with Zod
- SQL injection protection via Prisma
- Role-based access control

## License

MIT
