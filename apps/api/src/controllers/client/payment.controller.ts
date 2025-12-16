import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentService } from '../../services/paymentService.js';
import { queryOne } from '../../config/database.js';
import { log } from '../../utils/logger.js';

const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.number().int().positive(),
    returnUrl: z.string().url().optional(),
  }),
});

/**
 * Create payment URL for an order
 */
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createPaymentSchema.parse({ body: req.body }).body;
    const clientId = (req as any).user?.id;

    if (!clientId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify order belongs to client
    const order = await queryOne<{
      id: number;
      clientId: number;
      total: number;
      orderNumber: string;
      status: string;
      paymentMethod: string;
    }>(
      `SELECT id, clientId, total, orderNumber, status, paymentMethod 
       FROM orders 
       WHERE id = ? AND clientId = ?`,
      [data.orderId, clientId]
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({ error: 'Order is not in pending status' });
      return;
    }

    // Get payment method from order
    const paymentMethod = order.paymentMethod || 'COD';

    // Create payment based on method
    let paymentResult;
    switch (paymentMethod.toUpperCase()) {
      case 'MOMO':
      case 'WALLET': // WALLET is treated as MoMo for now
        paymentResult = await PaymentService.createMoMoPayment({
          orderId: order.id,
          amount: Number(order.total),
          orderInfo: `Payment for order ${order.orderNumber}`,
          returnUrl: data.returnUrl,
        });
        break;
      case 'ZALOPAY':
        paymentResult = await PaymentService.createZaloPayPayment({
          orderId: order.id,
          amount: Number(order.total),
          orderInfo: `Payment for order ${order.orderNumber}`,
          returnUrl: data.returnUrl,
        });
        break;
      case 'BANK':
        paymentResult = await PaymentService.createBankTransferPayment({
          orderId: order.id,
          amount: Number(order.total),
          orderInfo: `Thanh toan don hang ${order.orderNumber}`,
          returnUrl: data.returnUrl,
        });
        break;
      case 'VNPAY':
      default:
        paymentResult = await PaymentService.createVNPayPayment({
          orderId: order.id,
          amount: Number(order.total),
          orderInfo: `Thanh toan don hang ${order.orderNumber}`,
          returnUrl: data.returnUrl,
        });
        break;
    }

    if (!paymentResult.success) {
      res.status(400).json({ error: paymentResult.message || 'Payment creation failed' });
      return;
    }

    res.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      message: paymentResult.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    next(error);
  }
};

/**
 * Handle payment callback from VNPay
 */
export const paymentCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await PaymentService.verifyVNPayCallback(req.query as Record<string, string>);

    if (result.success && result.orderId) {
      // Redirect to success page
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?orderId=${result.orderId}`);
    } else {
      // Redirect to failure page
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?message=${encodeURIComponent(result.message || 'Payment failed')}`);
    }
  } catch (error) {
    log.error('Payment callback error', error as Error, { query: req.query });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?message=Error processing payment`);
  }
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const clientId = (req as any).user?.id;

    if (!clientId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify order belongs to client
    const order = await queryOne<{ id: number; clientId: number }>(
      `SELECT id, clientId FROM orders WHERE id = ? AND clientId = ?`,
      [orderId, clientId]
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Get payment info
    const payment = await PaymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json({
      orderId: payment.order_id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      status: payment.status,
      transactionId: payment.transaction_id,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mock payment success for testing (MoMo, ZaloPay)
 */
export const mockPaymentSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = parseInt(req.body.orderId, 10);
    const clientId = (req as any).user?.id;

    if (!clientId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify order belongs to client
    const order = await queryOne<{
      id: number;
      clientId: number;
      total: number;
      status: string;
      paymentMethod: string;
    }>(
      `SELECT id, clientId, total, status, paymentMethod 
       FROM orders 
       WHERE id = ? AND clientId = ?`,
      [orderId, clientId]
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({ error: 'Order is not in pending status' });
      return;
    }

    // Update payment and order status
    // updatePaymentStatus will create payment record if it doesn't exist
    const transactionId = `MOCK${orderId}_${Date.now()}`;
    await PaymentService.updatePaymentStatus(orderId, 'PAID', transactionId);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      orderId,
    });
  } catch (error) {
    const errorDetails = error as Error;
    log.error('Mock payment success error', errorDetails, {
      orderId: req.body.orderId,
      userId: (req as any).user?.id,
      message: errorDetails.message,
      stack: errorDetails.stack,
    });
    next(error);
  }
};

