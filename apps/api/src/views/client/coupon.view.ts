export const userCouponView = {
  validate(coupon) {
    return { valid: !!coupon, coupon };
  },

  apply(result) {
    return {
      discount: result.discount,
      coupon: result.coupon,
    };
  },
};


