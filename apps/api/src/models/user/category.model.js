import { adminCategoryModel } from '../admin/category.model.js';

export const userCategoryModel = {
  list() {
    return adminCategoryModel.list(false);
  },

  getById(id) {
    return adminCategoryModel.getById(id);
  },
};


