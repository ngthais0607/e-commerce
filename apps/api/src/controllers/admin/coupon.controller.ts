import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminCouponModel } from '../../models/admin/coupon.model.js';
import { adminCouponView } from '../../views/admin/coupon.view.js';

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

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
      pageSize: req.query.pageSize ? Math.min(parseInt(String(req.query.pageSize), 10), 100) : undefined,
      search: (req.query.search as string)?.trim(),
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      type: req.query.type as string | undefined,
    };

    const result = await adminCouponModel.list(filters);
    res.json(adminCouponView.list(result as { items: unknown[]; total: number; page: number; pageSize: number; totalPages: number }));
  } catch (error) {
    next(error);
  }
};

export const getCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await adminCouponModel.getByCode(req.params.code.toUpperCase());
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(adminCouponView.detail(coupon));
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCouponSchema.parse({ body: req.body }).body;
    const existing = await adminCouponModel.getByCode(data.code.toUpperCase());
    if (existing) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    const coupon = await adminCouponModel.create({
      ...data,
      code: data.code.toUpperCase(),
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
    });

    res.status(201).json(adminCouponView.detail(coupon));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code.toUpperCase();
    const data = createCouponSchema.partial().parse({ body: req.body }).body;
    const updateData: Record<string, unknown> = { ...data };

    if (data?.code) {
      updateData.code = data.code.toUpperCase();
    }
    if (data?.validFrom) {
      updateData.validFrom = new Date(data.validFrom) as unknown;
    }
    if (data?.validUntil) {
      updateData.validUntil = new Date(data.validUntil) as unknown;
    }

    const coupon = await adminCouponModel.update(code, updateData);
    res.json(adminCouponView.detail(coupon));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code.toUpperCase();
    await adminCouponModel.remove(code);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};


