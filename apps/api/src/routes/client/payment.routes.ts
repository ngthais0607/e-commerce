import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as paymentController from '../../controllers/client/payment.controller.js';

const router = Router();

/**
 * @route   POST /api/payments
 * @desc    Create payment URL for an order
 * @access  Private
 */
router.post('/', authenticate, paymentController.createPayment);

/**
 * @route   GET /api/payments/callback
 * @desc    Handle payment callback from VNPay
 * @access  Public
 */
router.get('/callback', paymentController.paymentCallback);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/order/:orderId', authenticate, paymentController.getPaymentStatus);

/**
 * @route   POST /api/payments/mock-success
 * @desc    Mock payment success for testing (MoMo, ZaloPay)
 * @access  Private
 */
router.post('/mock-success', authenticate, paymentController.mockPaymentSuccess);

export default router;

