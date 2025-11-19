import express from 'express';
import * as addressController from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, addressController.getAddresses);
router.get('/:id', authenticate, addressController.getAddress);
router.post('/', authenticate, addressController.createAddress);
router.put('/:id', authenticate, addressController.updateAddress);
router.delete('/:id', authenticate, addressController.deleteAddress);

export default router;

