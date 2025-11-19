import { prisma } from '../../prisma/client.js';

/**
 * Database connection handler
 * Prisma tự động quản lý connection pool và kết nối MySQL
 * Không cần kết nối thủ công - chỉ cần đảm bảo DATABASE_URL đúng trong .env
 */

// Test database connection
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;

