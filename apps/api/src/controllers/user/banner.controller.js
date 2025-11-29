import { userBannerModel } from '../../models/user/banner.model.js';
import { userBannerView } from '../../views/user/banner.view.js';

export const getBanners = async (req, res, next) => {
  try {
    const banners = await userBannerModel.list(req.query.position);
    res.json(userBannerView.list(banners));
  } catch (error) {
    next(error);
  }
};


