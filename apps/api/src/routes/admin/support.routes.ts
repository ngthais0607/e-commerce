import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as supportController from '../../controllers/admin/support.controller.js';

const router = Router();

// Chỉ cho phép STAFF dùng kênh support chat (admin không vào trang này)
// Lưu ý: middleware authorize nhận danh sách role dưới dạng nhiều tham số, không phải mảng
router.use(authenticate, authorize('STAFF'));

router.get('/conversations', supportController.listConversations);
router.post('/conversations/:id/claim', supportController.assignConversation);
router.post('/conversations/:id/close', supportController.closeConversation);
router.get('/conversations/:id/messages', supportController.getMessages);
router.post('/conversations/:id/messages', supportController.addMessage);

export default router;


