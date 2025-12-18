import { userBannerModel } from '../../models/client/banner.model.js';
import { userBannerView } from '../../views/client/banner.view.js';

export const getBanners = async (req, res, next) => {
  try {
    const banners = await userBannerModel.list(req.query.position);
    res.json(userBannerView.list(banners));
  } catch (error) {
    next(error);
  }
};


