import { prisma } from '../../../prisma/client.js';

export const adminBannerModel = {
  list(filters = {}) {
    const { position, includeInactive } = filters;
    return prisma.banner.findMany({
      where: {
        ...(position && { position }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  },

  create(data) {
    return prisma.banner.create({ data });
  },

  update(id, data) {
    return prisma.banner.update({ where: { id }, data });
  },

  remove(id) {
    return prisma.banner.delete({ where: { id } });
  },
};


