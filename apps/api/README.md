# E-Commerce API

Backend API cho ứng dụng E-Commerce, sử dụng Express.js, Prisma ORM và MySQL.

## Cấu Trúc Thư Mục

```
apps/api/
├── src/
│   ├── config/          # Cấu hình (database, app config)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── validators/       # Validation schemas
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   ├── seed.js          # Seed data
│   └── client.js        # Prisma client instance
├── index.js             # Entry point
└── .env                 # Environment variables
```

## Database Connection

### Prisma tự động kết nối MySQL

**Không cần kết nối thủ công!** Chỉ cần:

1. **Cấu hình DATABASE_URL trong `.env`:**
```env
DATABASE_URL="mysql://user:password@localhost:3306/ecommerce"
```

2. **Prisma sẽ tự động:**
   - Đọc connection string từ `.env`
   - Tạo connection pool
   - Quản lý kết nối hiệu quả
   - Tự động reconnect khi cần

3. **Sử dụng trong code:**
```javascript
import { prisma } from './prisma/client.js';

// Prisma đã tự động kết nối, chỉ cần dùng
const products = await prisma.product.findMany();
```

## Setup

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Cấu hình environment:**
```bash
cp env.example .env
# Chỉnh sửa .env với thông tin database của bạn
```

3. **Tạo database và chạy migrations:**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Seed data (optional):**
```bash
npm run db:seed
```

5. **Chạy development server:**
```bash
npm run dev
```

## Environment Variables

Xem file `env.example` để biết các biến môi trường cần thiết.

## API Endpoints

Xem file `PROJECT_STRUCTURE.md` ở root để biết chi tiết về các endpoints.

## Development

- **Hot reload**: Sử dụng `nodemon` tự động restart khi code thay đổi
- **Database changes**: Chạy `npx prisma migrate dev` sau khi thay đổi schema
- **View database**: Chạy `npx prisma studio` để mở GUI

