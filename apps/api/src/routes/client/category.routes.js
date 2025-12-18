import express from 'express';
import * as categoryController from '../../controllers/client/category.controller.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

export default router;


