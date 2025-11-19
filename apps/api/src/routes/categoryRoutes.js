import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), categoryController.deleteCategory);

export default router;

