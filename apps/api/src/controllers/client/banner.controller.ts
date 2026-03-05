import type { Request, Response, NextFunction } from 'express';
import { userBannerModel } from '../../models/client/banner.model.js';
import { userBannerView } from '../../views/client/banner.view.js';

export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await userBannerModel.list(req.query.position as string | undefined);
    res.json(userBannerView.list(banners));
  } catch (error) {
    next(error);
  }
};


