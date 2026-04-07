import express from 'express';
import { requestRefund, getRefundStatus } from '../../controllers/client/refund.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// POST /api/orders/:id/refund  - client requests a refund
router.post('/orders/:id/refund', requestRefund);

// GET /api/orders/:id/refund   - client checks refund status
router.get('/orders/:id/refund', getRefundStatus);

export default router;
