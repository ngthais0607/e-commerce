import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { refundModel } from '../../models/client/refund.model.js';
import { adminOrderModel } from '../../models/admin/order.model.js';
import { log } from '../../utils/logger.js';

const resolveRefundSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    adminNote: z.string().optional(),
  }),
});

export const listRefunds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await refundModel.listAll({
      page: parseInt(String(req.query.page || '1'), 10),
      pageSize: Math.min(parseInt(String(req.query.pageSize || '20'), 10), 100),
      status: req.query.status as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resolveRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid refund request ID' });
    }

    const parsed = resolveRefundSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { status, adminNote } = parsed.data.body;

    const refund = await refundModel.findById(id);

    if (!refund) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    if (refund.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending refund requests can be resolved' });
    }

    const resolved = await refundModel.resolve(id, status, adminNote);

    if (status === 'APPROVED') {
      try {
        await adminOrderModel.updateStatus(refund.orderId, {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        });
      } catch (err) {
        log.error('Failed to update order status after refund approval', err instanceof Error ? err : null, {
          refundId: id,
          orderId: refund.orderId,
        });
      }
    }

    res.json(resolved);
  } catch (error) {
    next(error);
  }
};
