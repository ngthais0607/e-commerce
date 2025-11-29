import { prisma } from '../../../prisma/client.js';

/**
 * Product data layer for admin scope
 */
export const adminProductModel = {
  async list(filters = {}) {
    const {
      page = 1,
      pageSize = 12,
      categoryId,
      search,
      minPrice,
      maxPrice,
      brand,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = filters;

    const where = {
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDesc: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(brand && { brand }),
      ...(isActive !== undefined && { isActive }),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  },

  async getBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async create(data) {
    return prisma.product.create({
      data,
      include: {
        category: true,
      },
    });
  },

  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  },

  async remove(id) {
    return prisma.product.delete({
      where: { id },
    });
  },
};


