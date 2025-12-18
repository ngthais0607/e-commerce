import express from 'express';
import * as couponController from '../../controllers/admin/coupon.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', couponController.getCoupons);
router.get('/:code', couponController.getCoupon);
router.post('/', couponController.createCoupon);
router.put('/:code', couponController.updateCoupon);
router.delete('/:code', couponController.deleteCoupon);

export default router;


