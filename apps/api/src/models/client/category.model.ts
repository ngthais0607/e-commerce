import { adminCategoryModel } from '../admin/category.model.js';

export const userCategoryModel = {
  list(filters = {}) {
    return adminCategoryModel.list(false, filters);
  },

  getById(id: number) {
    return adminCategoryModel.getById(id);
  },
};


