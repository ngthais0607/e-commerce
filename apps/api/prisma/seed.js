import prisma from './client.js';

async function main() {
  console.log('🌱 Start seeding...');
  const products = [
    { name: 'iPhone 15 Pro', price: 1200, description: 'Flagship smartphone from Apple' },
    { name: 'Samsung Galaxy S23', price: 1000, description: 'High-end Android smartphone from Samsung' },
    { name: 'MacBook Air M2', price: 1500, description: 'Lightweight and powerful Apple laptop' },
    { name: 'Áo Thun Basic', price: 199000, description: 'Áo thun cotton đơn giản, thoải mái' },
    { name: 'Giày Sneaker', price: 799000, description: 'Giày sneaker phong cách thể thao' },
    { name: 'Laptop Dell XPS', price: 24990000, description: 'Laptop Dell XPS mạnh mẽ cho công việc' }
  ];

  await prisma.product.createMany({ data: products, skipDuplicates: true });
  console.log('✅ Seed done!');
}

main().finally(async () => await prisma.$disconnect());
