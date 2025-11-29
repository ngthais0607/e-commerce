import { prisma } from '../../../prisma/client.js';

export const authUserModel = {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  createUser(data) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, role: true },
    });
  },

  findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  },
};


