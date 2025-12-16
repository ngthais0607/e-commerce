import express from 'express';
import * as orderController from '../../controllers/admin/order.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/:id/payment', orderController.getOrderPayment);
router.put('/:id/payment-status', orderController.updateOrderPaymentStatus);

export default router;


