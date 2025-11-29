import express from 'express';
import * as couponController from '../../controllers/user/coupon.controller.js';

const router = express.Router();

router.get('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);

export default router;


