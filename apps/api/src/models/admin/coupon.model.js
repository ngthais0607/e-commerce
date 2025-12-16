import { query, queryOne, insert, execute } from '../../config/database.js';

export const adminCouponModel = {
  async list(filters = {}) {
    const { page, pageSize, search, isActive, type } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (code LIKE ? OR name LIKE ? OR description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (isActive !== undefined) {
      whereClause += ` AND isActive = ?`;
      params.push(isActive);
    }

    if (type) {
      whereClause += ` AND type = ?`;
      params.push(type);
    }

    // If pagination is requested, return paginated results
    if (page !== undefined && pageSize !== undefined) {
      const [totalResult] = await query(
        `SELECT COUNT(*) as total FROM coupons ${whereClause}`,
        params
      );
      const total = totalResult.total;

      const items = await query(
        `SELECT * FROM coupons ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize]
      );

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    // Otherwise, return all results (backward compatibility)
    return query(
      `SELECT * FROM coupons ${whereClause} ORDER BY createdAt DESC`,
      params
    );
  },

  async getByCode(code) {
    return queryOne(
      `SELECT * FROM coupons WHERE code = ?`,
      [code]
    );
  },

  async create(data) {
    await insert(
      `INSERT INTO coupons (code, name, description, type, value, minOrderAmount, maxDiscount, usageLimit, usedCount, validFrom, validUntil, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.code,
        data.name,
        data.description || null,
        data.type,
        data.value,
        data.minOrderAmount || null,
        data.maxDiscount || null,
        data.usageLimit || null,
        data.usedCount || 0,
        data.validFrom,
        data.validUntil,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );

    return this.getByCode(data.code);
  },

  async update(code, data) {
    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }
    if (data.type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(data.type);
    }
    if (data.value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(data.value);
    }
    if (data.minOrderAmount !== undefined) {
      updateFields.push('minOrderAmount = ?');
      updateValues.push(data.minOrderAmount);
    }
    if (data.maxDiscount !== undefined) {
      updateFields.push('maxDiscount = ?');
      updateValues.push(data.maxDiscount);
    }
    if (data.usageLimit !== undefined) {
      updateFields.push('usageLimit = ?');
      updateValues.push(data.usageLimit);
    }
    if (data.usedCount !== undefined) {
      updateFields.push('usedCount = ?');
      updateValues.push(data.usedCount);
    }
    if (data.validFrom !== undefined) {
      updateFields.push('validFrom = ?');
      updateValues.push(data.validFrom);
    }
    if (data.validUntil !== undefined) {
      updateFields.push('validUntil = ?');
      updateValues.push(data.validUntil);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }

    if (updateFields.length === 0) {
      return this.getByCode(code);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(code);

    await execute(
      `UPDATE coupons SET ${updateFields.join(', ')} WHERE code = ?`,
      updateValues
    );

    return this.getByCode(code);
  },

  async remove(code) {
    const affectedRows = await execute(
      `DELETE FROM coupons WHERE code = ?`,
      [code]
    );
    return affectedRows > 0;
  },

  async apply(code, amount) {
    const coupon = await this.getByCode(code.toUpperCase());

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

    if (coupon.minOrderAmount && amount < parseFloat(coupon.minOrderAmount)) {
      throw new Error(`Minimum order amount of ${coupon.minOrderAmount} required`);
    }

    let discount = 0;
    if (coupon.type === 'PERCENT') {
      discount = (amount * parseFloat(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, parseFloat(coupon.maxDiscount));
      }
    } else {
      discount = Math.min(parseFloat(coupon.value), amount);
    }

    return { coupon, discount };
  },
};


