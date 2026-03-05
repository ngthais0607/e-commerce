import express from 'express';
import * as userController from '../../controllers/client/user.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.put('/profile', authenticate, userController.updateProfile);

export default router;


