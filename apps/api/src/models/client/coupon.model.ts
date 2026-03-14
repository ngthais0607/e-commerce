import { adminCouponModel } from '../admin/coupon.model.js';

export const userCouponModel = {
  validate(code: string) {
    if (!code) return null;
    return adminCouponModel.getByCode(code.toUpperCase());
  },

  apply(code: string, amount: number) {
    return adminCouponModel.apply(code, amount);
  },
};


