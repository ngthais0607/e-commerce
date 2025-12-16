import { z } from 'zod';
import { adminCategoryModel } from '../../models/admin/category.model.js';
import { adminCategoryView } from '../../views/admin/category.view.js';
import { generateSlug } from '../../utils/slug.js';

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().url().optional(),
    parentId: z.number().int().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const getCategories = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page, 10) : undefined,
      pageSize: req.query.pageSize ? Math.min(parseInt(req.query.pageSize, 10), 100) : undefined,
      search: req.query.search?.trim(),
      parentId: req.query.parentId ? parseInt(req.query.parentId, 10) : undefined,
    };

    const result = await adminCategoryModel.list(true, filters);
    
    // If pagination was used, result has pagination metadata
    if (result.items) {
      res.json(adminCategoryView.list(result));
    } else {
      // Backward compatibility: result is array
      res.json(adminCategoryView.list(result));
    }
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = await adminCategoryModel.getById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(adminCategoryView.detail(category));
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = createCategorySchema.parse({ body: req.body }).body;
    const slug = generateSlug(data.name);

    const existing = await adminCategoryModel.getBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'Category with similar name already exists' });
    }

    const category = await adminCategoryModel.create({ ...data, slug });
    res.status(201).json(adminCategoryView.detail(category));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = createCategorySchema.partial().parse({ body: req.body }).body;

    let updateData = { ...data };
    if (data.name) {
      const slug = generateSlug(data.name);
      const existing = await adminCategoryModel.findBySlugExcludingId(slug, id);
      if (!existing) {
        updateData.slug = slug;
      }
    }

    const category = await adminCategoryModel.update(id, updateData);
    res.json(adminCategoryView.detail(category));
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await adminCategoryModel.remove(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};


