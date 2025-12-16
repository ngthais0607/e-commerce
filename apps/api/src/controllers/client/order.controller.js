import { z } from 'zod';
import { userOrderModel } from '../../models/client/order.model.js';
import { userOrderView } from '../../views/client/order.view.js';
import { sendOrderConfirmation } from '../../services/emailService.js';
import { authClientModel } from '../../models/client/auth.model.js';
import { log } from '../../utils/logger.js';

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
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '10', 10), 50),
      status: req.query.status,
    };

    log.info('Fetching orders', { userId, filters });
    const result = await userOrderModel.list(userId, filters);
    log.info('Orders fetched', { userId, count: result.items?.length || 0, total: result.total });
    
    res.json(userOrderView.list(result));
  } catch (error) {
    log.error('Error fetching orders', error, { userId: req.user?.id });
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const order = await userOrderModel.getById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to current user
    // Order model returns clientId, not userId
    if (order.clientId && order.clientId !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(userOrderView.detail(order));
  } catch (error) {
    log.error('Error fetching order', error, {
      orderId: req.params.id,
      userId: req.user?.id,
    });
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    // Validate request body
    const validationResult = createOrderSchema.safeParse({ body: req.body });
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errors,
        message: errors[0]?.message || 'Invalid request data'
      });
    }

    const data = validationResult.data.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    log.info('Creating order', { userId, itemsCount: data.items?.length, paymentMethod: data.paymentMethod });
    
    const order = await userOrderModel.create({ userId, ...data });
    
    log.info('Order created', { orderId: order.id, orderNumber: order.orderNumber, userId });
    
    // Send order confirmation email (non-blocking)
    try {
      const user = await authClientModel.findById(userId);
      
      if (user) {
        await sendOrderConfirmation(order, {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      }
    } catch (emailError) {
      // Log but don't fail the request if email fails
      log.error('Failed to send order confirmation email', emailError, {
        orderId: order.id,
        userId,
      });
    }
    
    res.status(201).json(userOrderView.detail(order));
  } catch (error) {
    log.error('Error creating order', error, {
      userId: req.user?.id,
      body: req.body,
    });
    
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};


