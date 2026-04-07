import type { Request, Response, NextFunction } from 'express';
import { reviewModel } from '../../models/client/review.model.js';

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10);
    const pageSize = Math.min(parseInt(String(req.query.pageSize || '20'), 10), 100);
    const productId = req.query.productId ? parseInt(String(req.query.productId), 10) : undefined;

    const result = await reviewModel.listAll({ page, pageSize, productId });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const replyToReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid review id' });
    }

    const { reply } = req.body as { reply: string | null };

    const existing = await reviewModel.findUnique({ id });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updated = await reviewModel.replyToReview(id, reply ?? null);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
