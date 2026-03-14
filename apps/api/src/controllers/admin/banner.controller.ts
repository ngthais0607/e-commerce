import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminBannerModel } from '../../models/admin/banner.model.js';
import { adminBannerView } from '../../views/admin/banner.view.js';

const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    image: z.string().url(),
    link: z.string().url().optional(),
    position: z.string().default('homepage'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
});

export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = typeof req.query.position === 'string' ? req.query.position : undefined;
    const banners = await adminBannerModel.list({
      position,
      includeInactive: true,
    });
    res.json(adminBannerView.list(banners));
  } catch (error) {
    next(error);
  }
};

export const getBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid banner ID' });
    }

    const banner = await adminBannerModel.getById(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json(adminBannerView.detail(banner));
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBannerSchema.parse({ body: req.body }).body;
    const banner = await adminBannerModel.create(data);
    res.status(201).json(adminBannerView.detail(banner));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = createBannerSchema.partial().parse({ body: req.body }).body;
    const banner = await adminBannerModel.update(id, data as Record<string, unknown>);
    res.json(adminBannerView.detail(banner));
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await adminBannerModel.remove(id);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};


