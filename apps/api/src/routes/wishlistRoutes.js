import express from 'express';
import * as wishlistController from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, wishlistController.getWishlist);
router.post('/', authenticate, wishlistController.addToWishlist);
router.delete('/:productId', authenticate, wishlistController.removeFromWishlist);

export default router;

