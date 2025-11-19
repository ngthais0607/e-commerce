import { OrderService } from '../services/orderService.js';
import { z } from 'zod';

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
    items: z.array(z.object({
      productId: z.number().int(),
      quantity: z.number().int().min(1),
      attributes: z.record(z.any()).optional(),
    })).min(1),
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
      userId: req.user.role === 'ADMIN' 
        ? req.query.userId ? parseInt(req.query.userId, 10) : undefined 
        : req.user.id,
      paymentStatus: req.query.paymentStatus,
    };

    const result = await OrderService.getAllOrders(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await OrderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const data = createOrderSchema.parse({ body: req.body }).body;

    const orderData = {
      userId: req.user.id,
      ...data,
    };

    const order = await OrderService.createOrder(orderData);
    res.status(201).json(order);
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

export const updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, paymentStatus, trackingCode } = req.body;

    const order = await OrderService.updateOrderStatus(id, {
      status,
      paymentStatus,
      trackingCode,
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

