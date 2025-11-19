import { CouponService } from '../services/couponService.js';
import { z } from 'zod';

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.number().positive(),
    minOrderAmount: z.number().positive().optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    validFrom: z.string(),
    validUntil: z.string(),
    isActive: z.boolean().default(true),
  }),
});

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await CouponService.getAllCoupons();
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

export const getCoupon = async (req, res, next) => {
  try {
    const coupon = await CouponService.getCouponByCode(req.params.code);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const orderAmount = amount || 0;
    const result = await CouponService.applyCoupon(code, orderAmount);

    res.json({
      discount: result.discount,
      coupon: result.coupon,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid coupon code' });
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const data = createCouponSchema.parse({ body: req.body }).body;
    const coupon = await CouponService.createCoupon(data);
    res.status(201).json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const data = createCouponSchema.partial().parse({ body: req.body }).body;

    const coupon = await CouponService.updateCoupon(code, data);
    res.json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    await CouponService.deleteCoupon(code);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};
export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const coupon = await CouponService.getCouponByCode(code);

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    return res.json({ valid: true, coupon });
  } catch (error) {
    next(error);
  }
};
