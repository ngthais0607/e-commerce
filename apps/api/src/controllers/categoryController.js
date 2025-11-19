import { prisma } from '../../prisma/client.js';
import { generateSlug } from '../utils/slug.js';
import { z } from 'zod';

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
    const includeInactive = req.user?.role === 'ADMIN';
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          where: { isActive: true },
          take: 10,
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = createCategorySchema.parse({ body: req.body }).body;
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: 'Category with similar name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug,
      },
    });

    res.status(201).json(category);
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
      const existing = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (!existing) {
        updateData.slug = slug;
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

