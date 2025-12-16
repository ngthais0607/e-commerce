import { userProductModel } from '../../models/client/product.model.js';
import { userProductView } from '../../views/client/product.view.js';

export const getProducts = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '12', 10), 50),
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined,
      search: req.query.search?.trim(),
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      brand: req.query.brand?.trim(),
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const result = await userProductModel.list(filters);
    res.json(userProductView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
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

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await userProductModel.getBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(userProductView.detail(product));
  } catch (error) {
    next(error);
  }
};


