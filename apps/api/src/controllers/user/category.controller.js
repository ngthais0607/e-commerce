import { userCategoryModel } from '../../models/user/category.model.js';
import { userCategoryView } from '../../views/user/category.view.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await userCategoryModel.list();
    res.json(userCategoryView.list(categories));
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = await userCategoryModel.getById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(userCategoryView.detail(category));
  } catch (error) {
    next(error);
  }
};


