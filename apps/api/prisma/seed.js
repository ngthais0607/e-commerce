import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Customer User',
      role: 'CUSTOMER',
    },
  });

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
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Create a sample coupon
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

  console.log('Seed data created successfully!');
  console.log('Admin: admin@example.com / admin123');
  console.log('Customer: customer@example.com / customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
