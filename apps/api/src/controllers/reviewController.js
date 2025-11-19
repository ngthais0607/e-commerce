import { prisma } from '../../prisma/client.js';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const createReviewSchema = z.object({
  body: z.object({
    productId: z.number().int(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  }),
});

export const getReviews = async (req, res, next) => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId, 10) : undefined;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

    const where = productId ? { productId } : {};

    const [total, reviews] = await Promise.all([
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
    ]);

    res.json({
      items: reviews,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const data = createReviewSchema.parse({ body: req.body }).body;

    // Check if user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: data.productId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: {
          userId: req.user.id,
          status: { in: ['COMPLETED', 'SHIPPED'] },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: !!hasPurchased,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Update product rating
    const productReviews = await prisma.review.findMany({
      where: { productId: data.productId },
      select: { rating: true },
    });

    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        rating: new Decimal(avgRating.toFixed(2)),
        reviewCount: productReviews.length,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rating, title, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
      },
    });

    // Recalculate product rating
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true },
    });

    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: new Decimal(avgRating.toFixed(2)),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const review = await prisma.review.findUnique({ where: { id } });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate product rating
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true },
    });

    if (productReviews.length > 0) {
      const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: new Decimal(avgRating.toFixed(2)),
          reviewCount: productReviews.length,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: new Decimal(0),
          reviewCount: 0,
        },
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

