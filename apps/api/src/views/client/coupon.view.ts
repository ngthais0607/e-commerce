export const userCouponView = {
  validate(coupon: Record<string, unknown> | null) {
    return { valid: !!coupon, coupon };
  },

  apply(result: Record<string, unknown>) {
    const r = result as { discount?: unknown; coupon?: unknown };
    return {
      discount: r.discount,
      coupon: r.coupon,
    };
  },
};


