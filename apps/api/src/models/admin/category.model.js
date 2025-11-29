import { prisma } from '../../../prisma/client.js';

export const adminCategoryModel = {
  list(includeInactive = true) {
    return prisma.category.findMany({
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
  },

  getById(id) {
    return prisma.category.findUnique({
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
  },

  getBySlug(slug) {
    return prisma.category.findUnique({ where: { slug } });
  },

  findBySlugExcludingId(slug, id) {
    return prisma.category.findFirst({
      where: { slug, id: { not: id } },
    });
  },

  create(data) {
    return prisma.category.create({ data });
  },

  update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },

  remove(id) {
    return prisma.category.delete({ where: { id } });
  },
};


