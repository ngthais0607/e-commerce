import { queryOne } from '../../config/database.js';
import { supportConversationModel } from '../../models/supportConversation.model.js';
import { supportMessageModel } from '../../models/supportMessage.model.js';
import { emitSupportMessage, emitSupportNew } from '../../realtime/socket.js';

/**
 * Quick answer endpoint: returns order status if orderId provided and belongs to current user,
 * otherwise returns a short FAQ set.
 */
export const quickAnswer = async (req, res, next) => {
  try {
    const clientId = req.user?.id;
    const { orderId } = req.body || {};

    if (orderId) {
      // accept string/number
      const orderIdNum = Number(orderId);
      if (Number.isNaN(orderIdNum)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }

      if (!clientId) {
        return res.status(401).json({ error: 'Please sign in to view your order status.' });
      }

      const order = await queryOne(
        `SELECT id, orderNumber, status, paymentStatus, trackingCode, total, createdAt
         FROM orders
         WHERE id = ? AND clientId = ?`,
        [orderIdNum, clientId]
      );

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({
        type: 'order_status',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          trackingCode: order.trackingCode,
          total: Number(order.total),
          createdAt: order.createdAt,
        },
        message: `Order ${order.orderNumber || order.id} is ${order.status}. Payment is ${order.paymentStatus}${order.trackingCode ? `, tracking: ${order.trackingCode}` : ''}.`,
      });
    }

    // default FAQ suggestions
    return res.json({
      type: 'faq',
      faqs: [
        { q: 'Return policy?', a: 'You can return items within 7 days if they are unused and keep all original tags/labels. Please contact support for assistance.' },
        { q: 'Shipping fee?', a: 'Shipping fees are shown at checkout. Some orders may qualify for free shipping during promotions.' },
        { q: 'Payment methods?', a: 'We support COD, VNPAY, MoMo/Wallet, ZaloPay, and bank transfer.' },
        { q: 'Track my order?', a: 'You can enter your order ID to check its status. If tracking is available, we will show your tracking code.' },
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conv = await supportConversationModel.createOrGetOpenByUser(userId);
    // Notify staff there is a new/active conversation
    emitSupportNew(req.app.get('io'), conv);
    res.status(201).json(conv);
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const conversations = await supportConversationModel.listByUser(userId);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const conv = await supportConversationModel.getById(conversationId);
    if (!conv || conv.userId !== userId) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await supportMessageModel.listByConversation(conversationId);
    res.json({ conversationId, messages });
  } catch (error) {
    next(error);
  }
};

export const addMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });
    if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const conv = await supportConversationModel.getById(conversationId);
    if (!conv || conv.userId !== userId) return res.status(404).json({ error: 'Conversation not found' });

    const created = await supportMessageModel.createMessage({
      conversationId,
      senderRole: 'CUSTOMER',
      userId,
      message: message.trim(),
    });

    emitSupportMessage(req.app.get('io'), conversationId, created);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};


