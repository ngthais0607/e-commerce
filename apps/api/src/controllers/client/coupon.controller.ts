import type { Request, Response, NextFunction } from 'express';
import { userCouponModel } from '../../models/client/coupon.model.js';
import { userCouponView } from '../../views/client/coupon.view.js';

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

export const applyCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, amount } = req.body as { code?: string; amount?: number };

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const result = await userCouponModel.apply(code, amount || 0);
    res.json(userCouponView.apply(result));
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Invalid coupon code');
    res.status(400).json({ error: err.message || 'Invalid coupon code' });
  }
};


