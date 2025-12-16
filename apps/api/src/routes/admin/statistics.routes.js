import express from 'express';
import * as statisticsController from '../../controllers/admin/statistics.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', statisticsController.getStatistics);
router.get('/overview', statisticsController.getOverview);
router.get('/sales', statisticsController.getSalesByPeriod);
router.get('/top-products', statisticsController.getTopProducts);

export default router;

