import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { reviewModel } from '../../models/client/review.model.js';
import { reviewView } from '../../views/client/review.view.js';
import { emitAdminNotification } from '../../realtime/socket.js';

const createReviewSchema = z.object({
  body: z.object({
    productId: z.number().int(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  }),
});

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await reviewModel.list({
      productId: req.query.productId ? parseInt(String(req.query.productId), 10) : undefined,
      page: parseInt(String(req.query.page || '1'), 10),
      pageSize: Math.min(parseInt(String(req.query.pageSize || '10'), 10), 50),
    });
    res.json(reviewView.list(result));
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createReviewSchema.parse({ body: req.body }).body;

    const existing = await reviewModel.findUnique({
      clientId: req.user!.id,
      productId: data.productId,
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await reviewModel.create(req.user!.id, data);

    // Notify admin/staff in real-time (non-blocking)
    try {
      const io = (req as AuthenticatedRequest).app.get('io');
      if (io) {
        emitAdminNotification(io, 'new-review', {
          reviewId: review.id,
          productId: review.productId,
          rating: review.rating,
          customerName: (review.user as { name?: string } | null)?.name || 'Customer',
        });
      }
    } catch { /* non-critical */ }

    res.status(201).json(reviewView.detail(review));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rating, title, comment } = req.body as { rating?: number; title?: string; comment?: string };

    const review = await reviewModel.findUnique({ id });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if ((review as { clientId: number }).clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await reviewModel.update(id, {
      ...(rating && { rating }),
      ...(title !== undefined && { title }),
      ...(comment !== undefined && { comment }),
    });

    res.json(reviewView.detail(updated));
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const review = await reviewModel.findUnique({ id });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if ((review as { clientId: number }).clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await reviewModel.remove(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};


