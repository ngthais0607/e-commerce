import express from 'express';
import * as bannerController from '../controllers/bannerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', bannerController.getBanners);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), bannerController.createBanner);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), bannerController.updateBanner);
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), bannerController.deleteBanner);

export default router;

