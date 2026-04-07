import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { userOrderModel } from '../../models/client/order.model.js';
import { userOrderView } from '../../views/client/order.view.js';
import { sendOrderConfirmation } from '../../services/emailService.js';
import { authClientModel } from '../../models/client/auth.model.js';
import { log } from '../../utils/logger.js';
import { emitAdminNotification } from '../../realtime/socket.js';
import { query } from '../../config/database.js';

const LOW_STOCK_THRESHOLD = 5;

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

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      page: parseInt(String(req.query.page || '1'), 10),
      pageSize: Math.min(parseInt(String(req.query.pageSize || '10'), 10), 50),
      status: req.query.status as string | undefined,
    };

    log.info('Fetching orders', { userId, filters });
    const result = await userOrderModel.list(userId, filters);
    log.info('Orders fetched', { userId, count: result.items?.length || 0, total: result.total });
    res.json(userOrderView.list(result));
  } catch (error) {
    log.error('Error fetching orders', error instanceof Error ? error : null, { userId: req.user?.id });
    next(error);
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    const order = await userOrderModel.getById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.clientId && order.clientId !== req.user!.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(userOrderView.detail(order));
  } catch (error) {
    log.error('Error fetching order', error instanceof Error ? error : null, {
      orderId: req.params.id,
      userId: req.user?.id,
    });
    next(error);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    log.info('Order created', { orderId: order.id, orderNumber: order.orderNumber, userId });

    // Notify admin/staff in real-time (non-blocking)
    try {
      const io = req.app.get('io');
      if (io) {
        emitAdminNotification(io, 'new-order', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          customerName: req.user?.name || 'Customer',
        });
      }
    } catch { /* non-critical */ }

    // Check inventory levels and alert admin for low-stock products (non-blocking)
    try {
      const io = req.app.get('io');
      if (io && order.items?.length) {
        const productIds = order.items.map((item: { productId: number }) => item.productId);
        const placeholders = productIds.map(() => '?').join(',');
        const lowStockProducts = await query(
          `SELECT id, name, stock FROM products WHERE id IN (${placeholders}) AND stock <= ?`,
          [...productIds, LOW_STOCK_THRESHOLD]
        );
        for (const p of lowStockProducts) {
          emitAdminNotification(io, 'low-stock', {
            productId: p.id,
            productName: p.name,
            stock: p.stock,
          });
        }
      }
    } catch { /* non-critical */ }

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
      log.error('Failed to send order confirmation email', emailError instanceof Error ? emailError : null, {
        orderId: order.id,
        userId,
      });
    }

    res.status(201).json(userOrderView.detail(order));
  } catch (error: unknown) {
    log.error('Error creating order', error instanceof Error ? error : null, {
      userId: req.user?.id,
      body: req.body,
    });
    if (error instanceof Error && error.message) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};


