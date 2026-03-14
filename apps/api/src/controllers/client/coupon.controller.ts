import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userCouponModel } from '../../models/client/coupon.model.js';
import { userCouponView } from '../../views/client/coupon.view.js';

const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').max(50).trim(),
    amount: z.number().min(0).optional().default(0),
  }),
});

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string | undefined;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await userCouponModel.validate(code);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(userCouponView.validate(coupon));
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const parsed = applyCouponSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors.map((e) => e.message).join('; '),
      });
    }
    const { code, amount } = parsed.data.body;

    const result = await userCouponModel.apply(code, amount);
    res.json(userCouponView.apply(result));
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Invalid coupon code');
    res.status(400).json({ error: err.message || 'Invalid coupon code' });
  }
};


