import express from 'express';
import { getReviews, replyToReview } from '../../controllers/admin/review.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', getReviews);
router.patch('/:id/reply', replyToReview);

export default router;
