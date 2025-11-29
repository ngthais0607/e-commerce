import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../../prisma/client.js';

const recalcProductRating = async (productId) => {
  const productReviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  if (productReviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: new Decimal(0),
        reviewCount: 0,
      },
    });
    return;
  }

  const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: new Decimal(avgRating.toFixed(2)),
      reviewCount: productReviews.length,
    },
  });
};

export const reviewModel = {
  list(filters = {}) {
    const { productId, page = 1, pageSize = 10 } = filters;
    const where = productId ? { productId } : {};

    return Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
          product: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]).then(([total, reviews]) => ({
      items: reviews,
      total,
      page,
      pageSize,
    }));
  },

  findUnique(where) {
    return prisma.review.findUnique({ where });
  },

  async create(userId, data) {
    const { productId, rating, title, comment } = data;

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: ['COMPLETED', 'SHIPPED'] },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        isVerified: !!hasPurchased,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    await recalcProductRating(productId);
    return review;
  },

  async update(id, data) {
    const updated = await prisma.review.update({
      where: { id },
      data,
    });
    await recalcProductRating(updated.productId);
    return updated;
  },

  async remove(id) {
    const review = await prisma.review.delete({ where: { id } });
    await recalcProductRating(review.productId);
    return review;
  },
};


