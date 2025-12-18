/**
 * Script to seed default admin user
 * Run: npm run seed:admin
 * Or: tsx scripts/seed-admin.js
 */

import { hashPassword } from '../src/utils/password.js';
import { queryOne, insert, execute } from '../src/config/database.js';
import { log } from '../src/utils/logger.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ecommerce.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

async function seedAdmin() {
  try {
    console.log('\n=== Seeding Admin User ===\n');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Name:', ADMIN_NAME);
    console.log('');

    // Check if admin already exists
    const existingAdmin = await queryOne(
      `SELECT id, email, name, role FROM clients WHERE email = ?`,
      [ADMIN_EMAIL]
    );

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log('  ID:', existingAdmin.id);
      console.log('  Email:', existingAdmin.email);
      console.log('  Name:', existingAdmin.name);
      console.log('  Role:', existingAdmin.role);
      console.log('\nTo update password, delete the user first or use update script.');
      return;
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // Create admin user
    console.log('Creating admin user...');
    const adminId = await insert(
      `INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, NULL, 'ADMIN', 1, NOW(), NOW())`,
      [ADMIN_EMAIL, hashedPassword, ADMIN_NAME]
    );

    const admin = await queryOne(
      `SELECT id, email, name, role FROM clients WHERE id = ?`,
      [adminId]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.name);
    console.log('  Role:', admin.role);
    console.log('\n📝 Login Credentials:');
    console.log('  Email:', ADMIN_EMAIL);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Change password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    log.error('Failed to seed admin user', error);
    console.error('\n❌ Error seeding admin user:');
    console.error('  ', error.message);
    process.exit(1);
  }
}

seedAdmin();






