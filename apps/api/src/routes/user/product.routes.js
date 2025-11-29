import express from 'express';
import * as productController from '../../controllers/user/product.controller.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProduct);

export default router;


