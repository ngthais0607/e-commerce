import { prisma } from '../../../prisma/client.js';

export const adminCouponModel = {
  list() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  getByCode(code) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  create(data) {
    return prisma.coupon.create({ data });
  },

  update(code, data) {
    return prisma.coupon.update({ where: { code }, data });
  },

  remove(code) {
    return prisma.coupon.delete({ where: { code } });
  },

  async apply(code, amount) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new Error('Coupon is not active');
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
      throw new Error('Coupon is not valid at this time');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount of ${coupon.minOrderAmount} required`);
    }

    let discount = 0;
    if (coupon.type === 'PERCENT') {
      discount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = Math.min(coupon.value, amount);
    }

    return { coupon, discount };
  },
};


