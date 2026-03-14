import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as supportController from '../../controllers/admin/support.controller.js';

const router = Router();

// Admin và Staff đều được vào Support Chat
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/conversations', supportController.listConversations);
router.post('/conversations/:id/claim', supportController.assignConversation);
router.post('/conversations/:id/close', supportController.closeConversation);
router.get('/conversations/:id/messages', supportController.getMessages);
router.post('/conversations/:id/messages', supportController.addMessage);

export default router;


