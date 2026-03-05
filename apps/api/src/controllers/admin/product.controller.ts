import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminProductModel } from '../../models/admin/product.model.js';
import { adminProductView } from '../../views/admin/product.view.js';
import { generateSlug } from '../../utils/slug.js';

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    shortDesc: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive(),
    salePrice: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    sku: z.string().optional(),
    images: z.array(z.string().url()).min(1),
    attributes: z.record(z.any()).optional(),
    categoryId: z.number().int(),
    brand: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

const updateProductSchema = createProductSchema.partial();

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
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };

    const result = await adminProductModel.list(filters);
    res.json(adminProductView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await adminProductModel.getById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(adminProductView.detail(product));
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProductSchema.parse({ body: req.body }).body;
    const slug = generateSlug(data.name);

    const existing = await adminProductModel.getBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'Product with similar name already exists' });
    }

    const product = await adminProductModel.create({
      ...data,
      slug,
      images: data.images,
    });

    res.status(201).json(adminProductView.detail(product));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateProductSchema.parse({ body: req.body }).body;

    const updateData: Record<string, unknown> = { ...data };
    if (data?.name) {
      const slug = generateSlug(data.name);
      const existing = await adminProductModel.getBySlug(slug);
      if (!existing || existing.id === id) {
        updateData.slug = slug;
      }
    }

    const product = await adminProductModel.update(id, updateData);
    res.json(adminProductView.detail(product));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await adminProductModel.remove(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};


