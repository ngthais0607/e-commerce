-- ============================================
-- Script tạo Admin User trực tiếp trong SQL
-- Không cần dùng seed script
-- ============================================
-- Lưu ý: Password phải được hash bằng bcrypt với 12 salt rounds
-- ============================================

USE ecommerce;

-- ============================================
-- CÁCH 1: Sử dụng hash có sẵn cho password "Admin@123"
-- ============================================
-- Hash này được tạo từ password: Admin@123
-- Để tạo hash mới, xem phần CÁCH 2 bên dưới

INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
VALUES (
    'admin@ecommerce.com',
    '$2a$12$x1KrvsEkFqI7K2P2xNQW6e94EONl1d2axjPb.z8GEQYHZMlttZ51e',  -- Hash của "Admin@123"
    'Admin User',
    NULL,
    'ADMIN',
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    email = email;  -- Không update nếu đã tồn tại

-- ============================================
-- CÁCH 2: Tạo hash mới cho password của bạn
-- ============================================
-- Bước 1: Chạy lệnh này trong Node.js để tạo hash:
-- 
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 12).then(hash => console.log(hash));"
--
-- Hoặc sử dụng script tạm thời:
-- node -e "require('bcryptjs').hash('Admin@123', 12).then(h => console.log('Hash:', h));"
--
-- Bước 2: Copy hash được tạo ra và paste vào câu lệnh INSERT bên dưới:

-- INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
-- VALUES (
--     'admin@ecommerce.com',
--     'PASTE_YOUR_HASH_HERE',  -- Dán hash từ bước 1 vào đây
--     'Admin User',
--     NULL,
--     'ADMIN',
--     1,
--     NOW(),
--     NOW()
-- )
-- ON DUPLICATE KEY UPDATE
--     email = email;

-- ============================================
-- CÁCH 3: Sử dụng MySQL để tạo hash (nếu có extension)
-- ============================================
-- Nếu bạn đã cài đặt bcrypt extension cho MySQL, có thể dùng:
-- 
-- INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
-- VALUES (
--     'admin@ecommerce.com',
--     BCRYPT_HASH('Admin@123', 12),  -- Chỉ hoạt động nếu có extension
--     'Admin User',
--     NULL,
--     'ADMIN',
--     1,
--     NOW(),
--     NOW()
-- );

-- ============================================
-- Kiểm tra admin đã được tạo
-- ============================================
SELECT id, email, name, role, isActive, createdAt 
FROM clients 
WHERE role = 'ADMIN';

-- ============================================
-- Xóa admin (nếu cần)
-- ============================================
-- DELETE FROM clients WHERE email = 'admin@ecommerce.com' AND role = 'ADMIN';

