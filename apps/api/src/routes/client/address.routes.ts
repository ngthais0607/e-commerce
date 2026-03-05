import express from 'express';
import * as addressController from '../../controllers/client/address.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddress);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;


