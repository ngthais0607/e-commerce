import express from 'express';
import * as bannerController from '../../controllers/admin/banner.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', bannerController.getBanners);
router.post('/', bannerController.createBanner);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

export default router;


