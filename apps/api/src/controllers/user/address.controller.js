import { z } from 'zod';
import { addressModel } from '../../models/user/address.model.js';
import { addressView } from '../../views/user/address.view.js';

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
    const addresses = await addressModel.listByUser(req.user.id);
    res.json(addressView.list(addresses));
  } catch (error) {
    next(error);
  }
};

export const getAddress = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const address = await addressModel.findById(id);

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(addressView.detail(address));
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const data = createAddressSchema.parse({ body: req.body }).body;

    if (data.isDefault) {
      await addressModel.unsetDefault(req.user.id);
    }

    const address = await addressModel.create({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(addressView.detail(address));
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

    const address = await addressModel.findById(id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (data.isDefault) {
      await addressModel.unsetDefault(req.user.id, id);
    }

    const updated = await addressModel.update(id, data);
    res.json(addressView.detail(updated));
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const address = await addressModel.findById(id);

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (address.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await addressModel.remove(id);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};


