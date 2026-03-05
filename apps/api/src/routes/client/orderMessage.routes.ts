import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as orderMessageController from '../../controllers/client/orderMessage.controller.js';

const router = Router();

router.use(authenticate);

// Get messages for an order (customer perspective)
router.get('/orders/:orderId/messages', orderMessageController.getOrderMessages);

// Add a new customer message for an order
router.post('/orders/:orderId/messages', orderMessageController.addOrderMessage);

export default router;


