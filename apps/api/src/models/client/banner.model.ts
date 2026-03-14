import { adminBannerModel } from '../admin/banner.model.js';

export const userBannerModel = {
  list(position?: string) {
    return adminBannerModel.list({ position, includeInactive: false });
  },
};


