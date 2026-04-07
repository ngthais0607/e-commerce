import express from 'express';
import { listRefunds, resolveRefund } from '../../controllers/admin/refund.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/refunds           - list all refund requests
router.get('/', listRefunds);

// PUT /api/admin/refunds/:id       - approve or reject a refund request
router.put('/:id', resolveRefund);

export default router;
