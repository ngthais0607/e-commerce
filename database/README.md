# Database Setup Scripts

Folder này chứa các script để **tạo database và user ban đầu** trong MySQL.

## ⚠️ Quan trọng

**Bạn CẦN chạy các script này TRƯỚC khi chạy Prisma migrations!**

Lý do:
- Prisma **KHÔNG tự động tạo database**, chỉ tạo tables trong database đã có
- Cần tạo database và user trước khi Prisma có thể kết nối

## 📋 Các bước setup

### Bước 1: Tạo Database và User

**Windows:**
```bash
database\setup_database.bat
```

**Linux/Mac:**
```bash
bash database/setup_database.sh
```

Hoặc chạy SQL trực tiếp:
```bash
mysql -u root -p < database/create_database.sql
```

### Bước 2: Cấu hình .env

Sau khi tạo database, cấu hình `DATABASE_URL` trong `apps/api/.env`:

```env
DATABASE_URL="mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce"
```

**Lưu ý:** Nếu bạn dùng root user, sử dụng:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/ecommerce"
```

### Bước 3: Chạy Prisma Migrations

Sau khi database đã được tạo:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

## 📁 Các file trong folder

### `create_database.sql`
- Tạo database `ecommerce`
- Tạo user `ecommerce_user` với password `ecommerce_pass`
- Cấp quyền đầy đủ cho user


### `setup_database.bat` (Windows)
- Script tự động chạy `create_database.sql`
- Kiểm tra MySQL đã cài đặt
- Hiển thị thông tin kết nối sau khi tạo xong

### `setup_database.sh` (Linux/Mac)
- Tương tự như `.bat` nhưng cho Linux/Mac

## 🔐 Thông tin mặc định

Sau khi chạy script, bạn sẽ có:

- **Database:** `ecommerce`
- **User:** `ecommerce_user`
- **Password:** `ecommerce_pass`
- **Host:** `localhost`
- **Port:** `3306`

**Connection String:**
```
mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce
```

## ⚙️ Tùy chỉnh

Nếu muốn thay đổi tên database, user, hoặc password:

1. Sửa file `create_database.sql`
2. Cập nhật `DATABASE_URL` trong `.env`
3. Chạy lại script

## ❓ FAQ

### Q: Có thể bỏ qua bước này không?
**A:** Không! Prisma cần database đã tồn tại trước khi chạy migrations.

### Q: Prisma có tự tạo database không?
**A:** Không, Prisma chỉ tạo tables trong database đã có.

### Q: Có thể dùng root user không?
**A:** Có, nhưng không khuyến khích. Dùng user riêng an toàn hơn.

### Q: Script này có cần chạy lại không?
**A:** Chỉ cần chạy 1 lần khi setup lần đầu. Sau đó Prisma sẽ quản lý migrations.

## 🚀 Quick Start

```bash
# 1. Tạo database
database\setup_database.bat  # Windows
# hoặc
bash database/setup_database.sh  # Linux/Mac

# 2. Cấu hình .env
# Thêm DATABASE_URL vào apps/api/.env

# 3. Chạy Prisma
cd apps/api
npx prisma migrate dev
npm run db:seed
```

