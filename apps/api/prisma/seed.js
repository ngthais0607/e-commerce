import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  
  // Create admin user (đơn giản - password 6 ký tự để đáp ứng validation)
  // Sử dụng salt rounds 12 để khớp với password.js
  const adminPassword = await bcrypt.hash('admin1', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      password: adminPassword, // Update password nếu user đã tồn tại
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@admin.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created/updated:', admin.email);

  // Create customer user (đơn giản - password 6 ký tự để đáp ứng validation)
  const customerPassword = await bcrypt.hash('123456', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'user@user.com' },
    update: {
      password: customerPassword, // Update password nếu user đã tồn tại
      name: 'User',
      role: 'CUSTOMER',
      isActive: true,
    },
    create: {
      email: 'user@user.com',
      password: customerPassword,
      name: 'User',
      role: 'CUSTOMER',
      isActive: true,
    },
  });
  console.log('✅ Customer user created/updated:', customer.email);

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
    },
  });

  // Create more categories
  const books = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      slug: 'books',
      description: 'Books and literature',
    },
  });

  const home = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home and garden products',
    },
  });

  // Create products
  const products = [
    {
      name: 'Smartphone Pro',
      slug: 'smartphone-pro',
      shortDesc: 'Latest generation smartphone with advanced features',
      description: 'A powerful smartphone with cutting-edge technology, high-resolution camera, and long-lasting battery.',
      price: 999.99,
      salePrice: 899.99,
      stock: 50,
      sku: 'SP-001',
      images: ['https://via.placeholder.com/500', 'https://via.placeholder.com/500'],
      categoryId: electronics.id,
      brand: 'TechBrand',
      rating: 4.5,
      reviewCount: 25,
    },
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      shortDesc: 'Premium wireless headphones with noise cancellation',
      description: 'Experience superior sound quality with these premium wireless headphones featuring active noise cancellation.',
      price: 299.99,
      stock: 30,
      sku: 'WH-001',
      images: ['https://via.placeholder.com/500'],
      categoryId: electronics.id,
      brand: 'AudioTech',
      rating: 4.8,
      reviewCount: 15,
    },
    {
      name: 'Laptop Ultra',
      slug: 'laptop-ultra',
      shortDesc: 'High-performance laptop for professionals',
      description: 'Powerful laptop with latest processor, high-resolution display, and long battery life.',
      price: 1299.99,
      salePrice: 1149.99,
      stock: 20,
      sku: 'LT-001',
      images: ['https://via.placeholder.com/500'],
      categoryId: electronics.id,
      brand: 'TechBrand',
      rating: 4.7,
      reviewCount: 12,
    },
    {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      shortDesc: 'Comfortable cotton t-shirt in various colors',
      description: 'Soft and comfortable cotton t-shirt perfect for everyday wear. Available in multiple colors and sizes.',
      price: 29.99,
      salePrice: 24.99,
      stock: 100,
      sku: 'TS-001',
      images: ['https://via.placeholder.com/500'],
      attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Red', 'Blue', 'Black', 'White'] },
      categoryId: clothing.id,
      brand: 'FashionCo',
      rating: 4.3,
      reviewCount: 45,
    },
    {
      name: 'Denim Jeans',
      slug: 'denim-jeans',
      shortDesc: 'Classic denim jeans with perfect fit',
      description: 'High-quality denim jeans with comfortable fit and durable material.',
      price: 79.99,
      stock: 60,
      sku: 'DJ-001',
      images: ['https://via.placeholder.com/500'],
      attributes: { size: ['28', '30', '32', '34', '36'], color: ['Blue', 'Black'] },
      categoryId: clothing.id,
      brand: 'FashionCo',
      rating: 4.6,
      reviewCount: 30,
    },
    {
      name: 'Programming Book',
      slug: 'programming-book',
      shortDesc: 'Complete guide to modern programming',
      description: 'Comprehensive guide covering modern programming languages and best practices.',
      price: 49.99,
      stock: 200,
      sku: 'BK-001',
      images: ['https://via.placeholder.com/500'],
      categoryId: books.id,
      brand: 'TechBooks',
      rating: 4.9,
      reviewCount: 120,
    },
    {
      name: 'Garden Tools Set',
      slug: 'garden-tools-set',
      shortDesc: 'Complete set of garden tools',
      description: 'Professional garden tools set including shovel, rake, and pruning shears.',
      price: 89.99,
      salePrice: 69.99,
      stock: 40,
      sku: 'GT-001',
      images: ['https://via.placeholder.com/500'],
      categoryId: home.id,
      brand: 'GardenPro',
      rating: 4.4,
      reviewCount: 18,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Create sample coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off for new customers',
      type: 'PERCENT',
      value: 10,
      minOrderAmount: 50,
      maxDiscount: 50,
      usageLimit: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SAVE20' },
    update: {},
    create: {
      code: 'SAVE20',
      name: 'Save $20',
      description: 'Save $20 on orders over $100',
      type: 'FIXED',
      value: 20,
      minOrderAmount: 100,
      usageLimit: 50,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isActive: true,
    },
  });

  // Create sample banners
  await prisma.banner.createMany({
    data: [
      {
        title: 'Summer Sale',
        image: 'https://via.placeholder.com/800x400',
        link: '/shop',
        position: 'homepage',
        isActive: true,
        sortOrder: 1,
      },
      {
        title: 'New Arrivals',
        image: 'https://via.placeholder.com/800x400',
        link: '/shop',
        position: 'homepage',
        isActive: true,
        sortOrder: 2,
      },
      {
        title: 'Electronics Sale',
        image: 'https://via.placeholder.com/800x400',
        link: '/shop?category=electronics',
        position: 'homepage',
        isActive: true,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('📋 Account đăng nhập:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:');
  console.log('   Email: admin@admin.com');
  console.log('   Password: admin1');
  console.log('');
  console.log('👤 Customer:');
  console.log('   Email: user@user.com');
  console.log('   Password: 123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
