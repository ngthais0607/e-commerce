import express from 'express';
import * as addressController from '../../controllers/admin/address.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));
router.get('/', addressController.getAddresses);
router.get('/user/:userId', addressController.getUserAddresses);
router.get('/:id', addressController.getAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;

