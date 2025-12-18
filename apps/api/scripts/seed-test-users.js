/**
 * Script để tạo 5 user test
 * Chạy: npm run seed:test-users
 * Hoặc: node scripts/seed-test-users.js
 */

import { query, execute } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

const password = 'password123';

// 5 user test
const testUsers = [
  { email: 'user1@test.com', name: 'Nguyễn Văn A', phone: '0912345678' },
  { email: 'user2@test.com', name: 'Trần Thị B', phone: '0923456789' },
  { email: 'user3@test.com', name: 'Lê Văn C', phone: '0934567890' },
  { email: 'user4@test.com', name: 'Phạm Thị D', phone: '0945678901' },
  { email: 'user5@test.com', name: 'Hoàng Văn E', phone: '0956789012' }
];

async function seedTestUsers() {
  try {
    console.log('\n=== Seeding Test Users ===\n');
    console.log(`Password cho tất cả user: ${password}\n`);

    // Hash password một lần cho tất cả users
    console.log('Đang hash password...');
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password đã được hash\n');

    // Insert users
    let insertedCount = 0;
    let updatedCount = 0;

    for (const user of testUsers) {
      try {
        // Kiểm tra user đã tồn tại chưa
        const existing = await query(
          'SELECT id, email FROM clients WHERE email = ?',
          [user.email]
        );

        if (existing.length > 0) {
          console.log(`⚠️  User đã tồn tại: ${user.email}`);
          updatedCount++;
        } else {
          await execute(
            `INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, 'CUSTOMER', TRUE, NOW(), NOW())`,
            [user.email, hashedPassword, user.name, user.phone]
          );
          console.log(`✅ Đã tạo user: ${user.email} - ${user.name}`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Lỗi khi tạo user ${user.email}:`, error.message);
      }
    }

    console.log(`\n=== Kết quả ===`);
    console.log(`✅ Đã tạo mới: ${insertedCount} user(s)`);
    console.log(`⚠️  Đã tồn tại: ${updatedCount} user(s)`);
    console.log(`📊 Tổng cộng: ${testUsers.length} user(s)\n`);

    // Kiểm tra lại
    console.log('📝 Danh sách users test:');
    const users = await query(
      `SELECT id, email, name, phone, role, isActive 
       FROM clients 
       WHERE email LIKE '%@test.com'
       ORDER BY email`
    );

    if (users.length === 0) {
      console.log('⚠️  Không tìm thấy user nào!');
    } else {
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - ${user.role}`);
      });
    }

    console.log('\n✅ Hoàn thành!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi khi seed users:', error);
    process.exit(1);
  }
}

seedTestUsers();

