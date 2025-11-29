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
# Tạo file .env từ template
cp env.example .env
# Hoặc tạo thủ công file .env với nội dung:
# DATABASE_URL="mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce"
# JWT_SECRET="your-secret-key"
# PORT=4000
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

Cần cấu hình các biến môi trường sau trong file `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ecommerce"
JWT_SECRET="your-secret-key"
PORT=4000
```

## API Endpoints

Xem file `README.md` ở root để biết chi tiết về các endpoints.

## Development

- **Hot reload**: Sử dụng `nodemon` tự động restart khi code thay đổi
- **Database changes**: Chạy `npx prisma migrate dev` sau khi thay đổi schema
- **View database**: Chạy `npx prisma studio` để mở GUI

