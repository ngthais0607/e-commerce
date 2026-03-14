import { z } from 'zod';

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const;
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;

/**
 * Admin: update order status / tracking
 */
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    trackingCode: z.string().max(255).optional().nullable(),
    reason: z.string().max(500).optional(),
  }).refine(
    (data) => data.status !== undefined || data.trackingCode !== undefined,
    { message: 'At least one of status or trackingCode must be provided' }
  ),
});

/**
 * Admin: update order payment status
 */
export const updateOrderPaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(PAYMENT_STATUSES),
    transactionId: z.string().min(1).max(255).optional(),
    reason: z.string().max(500).optional(),
  }),
});

/**
 * Order ID param
 */
export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});

/**
 * Order message body (client / admin)
 */
export const orderMessageBodySchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(2000).transform((s) => s.trim()),
  }),
});

/**
 * Support chat message body
 */
export const supportMessageBodySchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(2000).transform((s) => s.trim()),
  }),
});
