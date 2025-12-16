import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { getStaffDashboard } from '../../controllers/admin/statistics.controller.js';

const router = Router();

// Staff-only lightweight dashboard (admins can also view)
router.use(authenticate, authorize('STAFF', 'ADMIN'));

router.get('/dashboard', getStaffDashboard);

export default router;


