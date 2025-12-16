import { userCategoryModel } from '../../models/client/category.model.js';
import { userCategoryView } from '../../views/client/category.view.js';

export const getCategories = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page, 10) : undefined,
      pageSize: req.query.pageSize ? Math.min(parseInt(req.query.pageSize, 10), 100) : undefined,
      search: req.query.search?.trim(),
      parentId: req.query.parentId ? parseInt(req.query.parentId, 10) : undefined,
    };

    const result = await userCategoryModel.list(filters);
    
    // If pagination was used, result has pagination metadata
    if (result.items) {
      res.json(userCategoryView.list(result));
    } else {
      // Backward compatibility: result is array
      res.json(userCategoryView.list(result));
    }
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


