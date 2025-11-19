import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), userController.getUsers);
router.get('/:id', authenticate, authorize('ADMIN'), userController.getUser);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/:id', authenticate, authorize('ADMIN'), userController.updateUser);

export default router;

