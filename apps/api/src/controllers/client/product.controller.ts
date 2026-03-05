import type { Request, Response, NextFunction } from 'express';
import { userProductModel } from '../../models/client/product.model.js';
import { userProductView } from '../../views/client/product.view.js';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      page: parseInt(String(req.query.page || '1'), 10),
      pageSize: Math.min(parseInt(String(req.query.pageSize || '12'), 10), 50),
      categoryId: req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined,
      search: (req.query.search as string)?.trim(),
      minPrice: req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined,
      brand: (req.query.brand as string)?.trim(),
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' as const : 'desc' as const,
    };

    const result = await userProductModel.list(filters);
    res.json(userProductView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await userProductModel.getById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(userProductView.detail(product));
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await userProductModel.getBySlug(req.params.slug as string);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(userProductView.detail(product));
  } catch (error) {
    next(error);
  }
};


