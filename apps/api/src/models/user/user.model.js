import { prisma } from '../../../prisma/client.js';
import { hashPassword } from '../../utils/password.js';

export const userProfileModel = {
  async update(id, data) {
    const updateData = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  },
};


