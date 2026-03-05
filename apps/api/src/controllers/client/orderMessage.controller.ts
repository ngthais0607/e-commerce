import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { orderMessageModel } from '../../models/admin/orderMessage.model.js';
import { queryOne } from '../../config/database.js';
import { log } from '../../utils/logger.js';
import { emitOrderMessage } from '../../realtime/socket.js';

export const getOrderMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const clientId = req.user?.id;

    if (!clientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Verify order belongs to current client
    const order = await queryOne(
      `SELECT id, clientId FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!order || order.clientId !== clientId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const messages = await orderMessageModel.listByOrder(orderId);
    res.json({ orderId, messages });
  } catch (error) {
    log.error('Error fetching order messages', error instanceof Error ? error : null, {
      orderId: req.params.orderId,
      userId: req.user?.id,
    });
    next(error);
  }
};

export const addOrderMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const clientId = req.user?.id;
    const { message } = req.body;

    if (!clientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify order belongs to current client
    const order = await queryOne(
      `SELECT id, clientId FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!order || order.clientId !== clientId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const created = await orderMessageModel.createMessage({
      orderId,
      clientId: clientId as number,
      staffId: null,
      senderRole: 'CUSTOMER',
      message: message.trim(),
    });

    // Broadcast to sockets in this order room
    emitOrderMessage(req.app.get('io'), orderId, created);

    res.status(201).json(created);
  } catch (error) {
    log.error('Error creating order message', error instanceof Error ? error : null, {
      orderId: req.params.orderId,
      userId: req.user?.id,
      body: req.body,
    });
    next(error);
  }
};


