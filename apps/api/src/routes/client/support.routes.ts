import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as supportController from '../../controllers/client/support.controller.js';

const router = Router();

router.use(authenticate);
router.post('/quick-answer', supportController.quickAnswer);
router.post('/conversations', supportController.createConversation);
router.get('/conversations', supportController.listConversations);
router.get('/conversations/:id/messages', supportController.getMessages);
router.post('/conversations/:id/messages', supportController.addMessage);

export default router;


