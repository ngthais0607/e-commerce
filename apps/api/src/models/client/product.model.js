import { adminProductModel } from '../admin/product.model.js';

/**
 * Product data layer for customer-facing flows
 */
export const userProductModel = {
  async list(filters = {}) {
    return adminProductModel.list({
      ...filters,
      isActive: filters.isActive ?? true,
    });
  },

  async getById(id) {
    const product = await adminProductModel.getById(id);
    if (!product || product.isActive === false) {
      return null;
    }
    return product;
  },

  async getBySlug(slug) {
    const product = await adminProductModel.getBySlug(slug);
    if (!product || product.isActive === false) {
      return null;
    }
    return product;
  },
};


