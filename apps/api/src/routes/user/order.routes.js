import express from 'express';
import * as orderController from '../../controllers/user/order.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);

export default router;


