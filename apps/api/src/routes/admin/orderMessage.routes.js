import express from 'express';
import * as orderMessageController from '../../controllers/admin/orderMessage.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));

// Get all messages for an order
router.get('/orders/:orderId/messages', orderMessageController.getOrderMessages);

// Add a new staff/admin message for an order
router.post('/orders/:orderId/messages', orderMessageController.addOrderMessage);

export default router;


