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

2. Start the database (using Docker - recommended)
```bash
docker-compose up -d
```

Hoặc cài đặt MySQL thủ công và tạo database:
```sql
CREATE DATABASE ecommerce;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'ecommerce_pass';
GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
```

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

After running the seed script:
- Admin: `admin@example.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

## Project Structure

```
E-Commerce/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── controllers/  # Route controllers
│   │   │   ├── middleware/   # Auth, error handling, etc.
│   │   │   ├── routes/       # API routes
│   │   │   └── utils/        # Utilities
│   │   ├── prisma/          # Database schema and migrations
│   │   └── index.js         # Entry point
│   └── web/                 # Frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── store/      # Zustand stores
│       │   └── lib/         # Utilities and types
│       └── vite.config.ts
└── docker-compose.yml      # Database setup
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (Admin)

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Coupons
- `GET /api/coupons` - List coupons
- `GET /api/coupons/validate` - Validate coupon
- `POST /api/coupons` - Create coupon (Admin)

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Addresses
- `GET /api/addresses` - List addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

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
