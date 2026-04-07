import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { refundModel } from '../../models/client/refund.model.js';
import { adminOrderModel } from '../../models/admin/order.model.js';

const requestRefundSchema = z.object({
  body: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  }),
});

// Orders eligible for refund request
const REFUNDABLE_STATUSES = ['PAID', 'PROCESSING'];

export const requestRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const parsed = requestRefundSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const order = await adminOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        error: `Refund can only be requested for orders with status: ${REFUNDABLE_STATUSES.join(', ')}`,
      });
    }

    const existing = await refundModel.findByOrder(orderId);
    if (existing && existing.status === 'PENDING') {
      return res.status(409).json({ error: 'A refund request is already pending for this order' });
    }
    if (existing && existing.status === 'APPROVED') {
      return res.status(409).json({ error: 'This order has already been refunded' });
    }

    const refund = await refundModel.create(orderId, req.user!.id, parsed.data.body.reason);
    res.status(201).json(refund);
  } catch (error) {
    next(error);
  }
};

export const getRefundStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await adminOrderModel.getById(orderId);
    if (!order || order.clientId !== req.user!.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const refund = await refundModel.findByOrder(orderId);
    if (!refund) {
      return res.status(404).json({ error: 'No refund request found for this order' });
    }

    res.json(refund);
  } catch (error) {
    next(error);
  }
};
