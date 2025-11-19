import { z } from 'zod';

/**
 * Product Validators
 * Tách validation schemas ra khỏi controller
 */

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    shortDesc: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    salePrice: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    sku: z.string().optional(),
    images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
    attributes: z.record(z.any()).optional(),
    categoryId: z.number().int('Category ID must be an integer'),
    brand: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const productSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

