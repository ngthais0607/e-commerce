import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, couponController.getCoupons);
router.get('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);
router.get('/:code', couponController.getCoupon);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), couponController.createCoupon);
router.put('/:code', authenticate, authorize('ADMIN', 'STAFF'), couponController.updateCoupon);
router.delete('/:code', authenticate, authorize('ADMIN', 'STAFF'), couponController.deleteCoupon);

export default router;

