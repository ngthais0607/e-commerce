import { userCouponModel } from '../../models/user/coupon.model.js';
import { userCouponView } from '../../views/user/coupon.view.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.query;

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

export const applyCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const result = await userCouponModel.apply(code, amount || 0);
    res.json(userCouponView.apply(result));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Invalid coupon code' });
  }
};


