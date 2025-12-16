import { orderMessageModel } from '../../models/admin/orderMessage.model.js';
import { adminOrderModel } from '../../models/admin/order.model.js';
import { emitOrderMessage } from '../../realtime/socket.js';

export const getOrderMessages = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);

    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await adminOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const messages = await orderMessageModel.listByOrder(orderId);
    res.json({ orderId, messages });
  } catch (error) {
    next(error);
  }
};

export const addOrderMessage = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const { message } = req.body;

    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const order = await adminOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const user = req.user;
    const senderRole = user?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';

    const created = await orderMessageModel.createMessage({
      orderId,
      clientId: null,
      staffId: user?.id ?? null,
      senderRole,
      message: message.trim(),
    });

    // Broadcast to sockets in this order room
    emitOrderMessage(req.app.get('io'), orderId, created);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};


