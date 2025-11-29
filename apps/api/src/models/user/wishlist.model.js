import { prisma } from '../../../prisma/client.js';

export const wishlistModel = {
  list(userId) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  find(userId, productId) {
    return prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  },

  add(userId, productId) {
    return prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });
  },

  remove(userId, productId) {
    return prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  },
};


