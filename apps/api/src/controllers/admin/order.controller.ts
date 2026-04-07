import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { updateOrderStatusSchema, updateOrderPaymentStatusSchema } from '../../validators/orderValidator.js';
import { adminOrderModel } from '../../models/admin/order.model.js';
import { adminOrderView } from '../../views/admin/order.view.js';
import { sendOrderStatusUpdate, sendOrderShipped, sendOrderCancelled } from '../../services/emailService.js';
import { authClientModel } from '../../models/client/auth.model.js';
import { log } from '../../utils/logger.js';
import { PaymentService } from '../../services/paymentService.js';
import { orderMessageModel } from '../../models/admin/orderMessage.model.js';

const ORDER_STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
// Staff can update order status including cancel, but cannot change to PENDING/PAID
const STAFF_ORDER_STATUS_OPTIONS = ['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const PAYMENT_STATUS_TRANSITIONS = {
  PENDING: ['PAID', 'FAILED'],
  FAILED: ['PENDING', 'PAID'],
  PAID: ['REFUNDED'],
  REFUNDED: [],
};
const REFUND_BLOCKED_STATUSES = ['SHIPPED', 'COMPLETED'];

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = {
      page: parseInt(String(req.query.page || '1'), 10),
      pageSize: Math.min(parseInt(String(req.query.pageSize || '20'), 10), 100),
      status: req.query.status as string | undefined,
      userId: req.query.userId ? parseInt(String(req.query.userId), 10) : undefined,
      paymentStatus: req.query.paymentStatus as string | undefined,
    };

    const result = await adminOrderModel.list(filters);
    res.json(adminOrderView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const parsed = updateOrderStatusSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: parsed.error.errors.map((e) => e.message).join('; '),
      });
    }
    const { status, trackingCode, reason } = parsed.data.body;

    if ((req.body as { paymentStatus?: string }).paymentStatus !== undefined) {
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
      // Staff can update tracking codes
      // Staff can update status to PROCESSING, SHIPPED, COMPLETED, or CANCELLED
      if (status && !STAFF_ORDER_STATUS_OPTIONS.includes(status)) {
        return res.status(403).json({ 
          error: 'Staff can only update order status to PROCESSING, SHIPPED, COMPLETED, or CANCELLED' 
        });
      }
      // Staff cannot change status backwards (e.g., from SHIPPED to PROCESSING)
      // But can cancel from any status (except SHIPPED/COMPLETED which is checked below)
      if (status && status !== 'CANCELLED' && oldOrder.status) {
        const statusOrder = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
        const oldIndex = statusOrder.indexOf(oldOrder.status);
        const newIndex = statusOrder.indexOf(status);
        if (newIndex < oldIndex) {
          return res.status(403).json({ 
            error: 'Staff cannot change order status backwards' 
          });
        }
      }
    }

    if (status === 'CANCELLED' && REFUND_BLOCKED_STATUSES.includes(oldOrder.status)) {
      return res.status(400).json({ error: 'Cannot cancel an order that has already shipped or completed' });
    }

    const order = await adminOrderModel.updateStatus(id, { status, trackingCode });
    if (!order) {
      return res.status(500).json({ error: 'Failed to update order' });
    }

    if (status && status !== oldOrder.status) {
      await orderMessageModel.createMessage({
        orderId: id,
        clientId: null,
        staffId: staffId ?? null,
        senderRole: actorRole,
        message: `Status changed from ${oldOrder.status} to ${status}${reason ? ` (reason: ${reason})` : ''}`,
      });
    }

    if (trackingCode !== undefined && trackingCode !== oldOrder.trackingCode && req.user?.role === 'ADMIN') {
      await orderMessageModel.createMessage({
        orderId: id,
        clientId: null,
        staffId: staffId ?? null,
        senderRole: 'ADMIN',
        message: `Tracking code updated to ${trackingCode || 'N/A'}`,
      });
    }

    // Send email notification if status changed (non-blocking)
    if (status && status !== oldOrder.status) {
      try {
        const user = await authClientModel.findById(order.clientId);

        if (user) {
          const userPayload = { id: user.id, email: user.email, name: user.name };
          if (status === 'SHIPPED') {
            await sendOrderShipped(order, userPayload);
          } else if (status === 'CANCELLED') {
            await sendOrderCancelled(order, userPayload, reason);
          } else {
            await sendOrderStatusUpdate(order, userPayload, oldOrder.status, status);
          }
        }
      } catch (emailError) {
        log.error('Failed to send order status update email', emailError instanceof Error ? emailError : null, {
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

export const getOrderPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const updateOrderPaymentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const bodyParsed = updateOrderPaymentStatusSchema.safeParse({ body: req.body });
    if (!bodyParsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: bodyParsed.error.errors.map((e) => e.message).join('; '),
      });
    }
    const { status, transactionId, reason } = bodyParsed.data.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await adminOrderModel.getById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentPaymentStatus = order.paymentStatus;
    const allowedNextStatuses = (PAYMENT_STATUS_TRANSITIONS as Record<string, string[]>)[currentPaymentStatus] || [];
    const actorRole = req.user?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const staffId = req.user?.id ?? null;
    const normalizedReason = reason?.trim() ?? '';

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
      staffId: staffId ?? null,
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



