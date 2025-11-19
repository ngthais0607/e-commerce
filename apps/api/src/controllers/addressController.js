import { prisma } from '../../prisma/client.js';
import { z } from 'zod';

const createAddressSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    ward: z.string().min(1),
    postalCode: z.string().optional(),
    isDefault: z.boolean().default(false),
  }),
});

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(addresses);
  } catch (error) {
    next(error);
  }
};

export const getAddress = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(address);
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const data = createAddressSchema.parse({ body: req.body }).body;

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: req.user.id,
      },
    });

    res.status(201).json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = createAddressSchema.partial().parse({ body: req.body }).body;

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const address = await prisma.address.findUnique({ where: { id } });
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.address.delete({ where: { id } });
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};

