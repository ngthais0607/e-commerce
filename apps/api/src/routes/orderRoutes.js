import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/', authenticate, orderController.createOrder);
router.put('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), orderController.updateOrderStatus);

export default router;

