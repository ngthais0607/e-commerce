import { productService } from '../services/productService.js';
import { generateSlug } from '../utils/slug.js';
import { z } from 'zod';

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
      isActive: req.user?.role === 'ADMIN' 
        ? req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
        : true,
    };

    const result = await productService.findAll(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.findBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = createProductSchema.parse({ body: req.body }).body;
    const slug = generateSlug(data.name);

    // Check if slug exists
    const existing = await productService.findBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'Product with similar name already exists' });
    }

    const product = await productService.create({
      ...data,
      slug,
      images: data.images,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateProductSchema.parse({ body: req.body }).body;

    let updateData = { ...data };
    
    // If name is being updated, regenerate slug
    if (data.name) {
      const slug = generateSlug(data.name);
      const existing = await productService.findBySlug(slug);
      if (!existing || existing.id === id) {
        updateData.slug = slug;
      }
    }

    const product = await productService.update(id, updateData);

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await productService.delete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

