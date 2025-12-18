import { adminOrderModel } from '../../models/admin/order.model.js';
import { adminOrderView } from '../../views/admin/order.view.js';
import { sendOrderStatusUpdate } from '../../services/emailService.js';
import { authClientModel } from '../../models/client/auth.model.js';
import { log } from '../../utils/logger.js';
import { PaymentService } from '../../services/paymentService.js';
import { orderMessageModel } from '../../models/admin/orderMessage.model.js';

const ORDER_STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const STAFF_ORDER_STATUS_OPTIONS = ['CANCELLED'];
const PAYMENT_STATUS_OPTIONS = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const PAYMENT_STATUS_TRANSITIONS = {
  PENDING: ['PAID', 'FAILED'],
  FAILED: ['PENDING', 'PAID'],
  PAID: ['REFUNDED'],
  REFUNDED: [],
};
const REFUND_BLOCKED_STATUSES = ['SHIPPED', 'COMPLETED'];

export const getOrders = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '20', 10), 100),
      status: req.query.status,
      userId: req.query.userId ? parseInt(req.query.userId, 10) : undefined,
      paymentStatus: req.query.paymentStatus,
    };

    const result = await adminOrderModel.list(filters);
    res.json(adminOrderView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await adminOrderModel.getById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(adminOrderView.detail(order));
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get old order to compare status
    const oldOrder = await adminOrderModel.getById(id);
    if (!oldOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status, paymentStatus, trackingCode, reason } = req.body;

    if (paymentStatus !== undefined) {
      return res.status(400).json({ error: 'Use /payment-status endpoint to update payment status' });
    }

    if (!status && trackingCode === undefined) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    if (status && !ORDER_STATUS_OPTIONS.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const isStaff = req.user?.role === 'STAFF';
    const actorRole = req.user?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const staffId = req.user?.id ?? null;

    if (isStaff) {
      if (trackingCode !== undefined) {
        return res.status(403).json({ error: 'Staff cannot update tracking codes' });
      }
      if (status && !STAFF_ORDER_STATUS_OPTIONS.includes(status)) {
        return res.status(403).json({ error: 'Staff can only cancel orders' });
      }
    }

    if (status === 'CANCELLED' && REFUND_BLOCKED_STATUSES.includes(oldOrder.status)) {
      return res.status(400).json({ error: 'Cannot cancel an order that has already shipped or completed' });
    }

    const order = await adminOrderModel.updateStatus(id, { status, trackingCode });

    if (status && status !== oldOrder.status) {
      await orderMessageModel.createMessage({
        orderId: id,
        clientId: null,
        staffId,
        senderRole: actorRole,
        message: `Status changed from ${oldOrder.status} to ${status}${reason ? ` (reason: ${reason})` : ''}`,
      });
    }

    if (trackingCode !== undefined && trackingCode !== oldOrder.trackingCode && req.user?.role === 'ADMIN') {
      await orderMessageModel.createMessage({
        orderId: id,
        clientId: null,
        staffId,
        senderRole: 'ADMIN',
        message: `Tracking code updated to ${trackingCode || 'N/A'}`,
      });
    }

    // Send email notification if status changed (non-blocking)
    if (status && status !== oldOrder.status) {
      try {
        const user = await authClientModel.findById(order.clientId);
        
        if (user) {
          await sendOrderStatusUpdate(order, {
            id: user.id,
            email: user.email,
            name: user.name,
          }, oldOrder.status, status);
        }
      } catch (emailError) {
        log.error('Failed to send order status update email', emailError, {
          orderId: order.id,
          clientId: order.clientId,
        });
      }
    }
    
    res.json(adminOrderView.detail(order));
  } catch (error) {
    next(error);
  }
};

export const getOrderPayment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await adminOrderModel.getById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const payment = await PaymentService.getPaymentByOrderId(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      orderId: payment.order_id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      status: payment.status,
      transactionId: payment.transaction_id,
      transactionRef: payment.transaction_ref,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderPaymentStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, transactionId, reason } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    if (!status || !PAYMENT_STATUS_OPTIONS.includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const order = await adminOrderModel.getById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentPaymentStatus = order.paymentStatus;
    const allowedNextStatuses = PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus] || [];
    const actorRole = req.user?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const staffId = req.user?.id ?? null;
    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';

    if (status === currentPaymentStatus) {
      const payment = await PaymentService.getPaymentByOrderId(id);
      return res.json({
        success: true,
        message: 'Payment status unchanged',
        payment: payment
          ? {
              orderId: payment.order_id,
              amount: Number(payment.amount),
              paymentMethod: payment.payment_method,
              status: payment.status,
              transactionId: payment.transaction_id,
              transactionRef: payment.transaction_ref,
              createdAt: payment.created_at,
              updatedAt: payment.updated_at,
            }
          : null,
      });
    }

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        error: `Cannot change payment status from ${currentPaymentStatus} to ${status}`,
      });
    }

    if (status === 'PAID') {
      if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
        return res.status(400).json({ error: 'Transaction ID is required to confirm payment' });
      }
    }

    if (status === 'REFUNDED') {
      if (currentPaymentStatus !== 'PAID') {
        return res.status(400).json({ error: 'Only paid orders can be refunded' });
      }
      if (REFUND_BLOCKED_STATUSES.includes(order.status)) {
        return res.status(400).json({ error: 'Cannot refund an order that has already shipped or completed' });
      }
    }

    await PaymentService.updatePaymentStatus(id, status, transactionId);

    const payment = await PaymentService.getPaymentByOrderId(id);

    await orderMessageModel.createMessage({
      orderId: id,
      clientId: null,
      staffId,
      senderRole: actorRole,
      message: `Payment status changed from ${currentPaymentStatus} to ${status}${transactionId ? ` (txn: ${transactionId})` : ''}${normalizedReason ? ` - ${normalizedReason}` : ''}`,
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: payment
        ? {
            orderId: payment.order_id,
            amount: Number(payment.amount),
            paymentMethod: payment.payment_method,
            status: payment.status,
            transactionId: payment.transaction_id,
            transactionRef: payment.transaction_ref,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};



