import { z } from 'zod';
import { userOrderModel } from '../../models/user/order.model.js';
import { userOrderView } from '../../views/user/order.view.js';

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      name: z.string(),
      phone: z.string(),
      address: z.string(),
      city: z.string(),
      district: z.string(),
      ward: z.string(),
      postalCode: z.string().optional(),
    }),
    phone: z.string(),
    email: z.string().email().optional(),
    notes: z.string().optional(),
    paymentMethod: z.string(),
    items: z.array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1),
        attributes: z.record(z.any()).optional(),
      }),
    ).min(1),
    couponCode: z.string().optional(),
    shippingFee: z.number().default(0),
  }),
});

export const getOrders = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '10', 10), 50),
      status: req.query.status,
    };

    const result = await userOrderModel.list(req.user.id, filters);
    res.json(userOrderView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await userOrderModel.getById(id);

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(userOrderView.detail(order));
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const data = createOrderSchema.parse({ body: req.body }).body;
    const order = await userOrderModel.create({ userId: req.user.id, ...data });
    res.status(201).json(userOrderView.detail(order));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};


