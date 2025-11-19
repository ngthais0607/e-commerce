import { prisma } from '../../prisma/client.js';

export class CouponService {
  static async getAllCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCouponByCode(code) {
    return prisma.coupon.findUnique({
      where: { code },
    });
  }

  static async createCoupon(data) {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive = true,
    } = data;

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      throw new Error('Coupon code already exists');
    }

    return prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive,
      },
    });
  }

  static async updateCoupon(code, data) {
    const updateData = { ...data };

    if (data.validFrom) {
      updateData.validFrom = new Date(data.validFrom);
    }
    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }
    if (data.code) {
      updateData.code = data.code.toUpperCase();
    }

    return prisma.coupon.update({
      where: { code },
      data: updateData,
    });
  }

  static async deleteCoupon(code) {
    return prisma.coupon.delete({
      where: { code },
    });
  }

  static async applyCoupon(code, amount) {
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

    return {
      coupon,
      discount,
    };
  }
}

