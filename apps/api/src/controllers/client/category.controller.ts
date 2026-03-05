import type { Request, Response, NextFunction } from 'express';
import { userCategoryModel } from '../../models/client/category.model.js';
import { userCategoryView } from '../../views/client/category.view.js';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
      pageSize: req.query.pageSize ? Math.min(parseInt(String(req.query.pageSize), 10), 100) : undefined,
      search: (req.query.search as string)?.trim(),
      parentId: req.query.parentId ? parseInt(String(req.query.parentId), 10) : undefined,
    };

    const result = await userCategoryModel.list(filters);
    res.json(userCategoryView.list(result as { items: unknown[]; total: number; page: number; pageSize: number; totalPages: number }));
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
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


