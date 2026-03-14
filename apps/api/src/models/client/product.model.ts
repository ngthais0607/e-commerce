import type { ProductListFilters } from '../../types/models.js';
import { adminProductModel } from '../admin/product.model.js';

/**
 * Product data layer for customer-facing flows
 */
export const userProductModel = {
  async list(filters: ProductListFilters = {}) {
    return adminProductModel.list({
      ...filters,
      isActive: filters.isActive ?? true,
    });
  },

  async getById(id: number) {
    const product = await adminProductModel.getById(id);
    if (!product || (product as { isActive?: boolean }).isActive === false) {
      return null;
    }
    return product;
  },

  async getBySlug(slug: string) {
    const product = await adminProductModel.getBySlug(slug);
    if (!product || (product as { isActive?: boolean }).isActive === false) {
      return null;
    }
    return product;
  },
};


