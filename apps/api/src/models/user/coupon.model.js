import { adminCouponModel } from '../admin/coupon.model.js';

export const userCouponModel = {
  validate(code) {
    if (!code) return null;
    return adminCouponModel.getByCode(code.toUpperCase());
  },

  apply(code, amount) {
    return adminCouponModel.apply(code, amount);
  },
};


