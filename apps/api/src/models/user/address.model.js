import { prisma } from '../../../prisma/client.js';

export const addressModel = {
  listByUser(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  },

  findById(id) {
    return prisma.address.findUnique({ where: { id } });
  },

  unsetDefault(userId, excludeId) {
    return prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isDefault: false },
    });
  },

  create(data) {
    return prisma.address.create({ data });
  },

  update(id, data) {
    return prisma.address.update({ where: { id }, data });
  },

  remove(id) {
    return prisma.address.delete({ where: { id } });
  },
};


