import express from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.get('/slug/:slug', productController.getProductBySlug);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), productController.createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), productController.deleteProduct);

export default router;

