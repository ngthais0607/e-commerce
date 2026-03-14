import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { supportMessageBodySchema } from '../../validators/orderValidator.js';
import { supportConversationModel } from '../../models/supportConversation.model.js';
import { supportMessageModel } from '../../models/supportMessage.model.js';
import { emitSupportMessage, emitSupportAssignment, emitSupportClosure } from '../../realtime/socket.js';

export const listConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const rawStatuses = statusParam ? statusParam.split(',') : ['OPEN', 'ASSIGNED'];
    const statuses = rawStatuses
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);
    const conversations = await supportConversationModel.listByStatus(statuses.length ? statuses : ['OPEN', 'ASSIGNED']);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

export const assignConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const staffId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);
    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const updated = await supportConversationModel.assign(conversationId, staffId);
    if (!updated) return res.status(404).json({ error: 'Conversation not found' });

    emitSupportAssignment(req.app.get('io'), conversationId, updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const closeConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const updated = await supportConversationModel.close(conversationId);
    if (!updated) return res.status(404).json({ error: 'Conversation not found' });

    emitSupportClosure(req.app.get('io'), conversationId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const messages = await supportMessageModel.listByConversation(conversationId);
    res.json({ conversationId, messages });
  } catch (error) {
    next(error);
  }
};

export const addMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const staffId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);
    const parsed = supportMessageBodySchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join('; ') });
    }
    const { message } = parsed.data.body;

    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const created = await supportMessageModel.createMessage({
      conversationId,
      senderRole: req.user?.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
      staffId,
      message,
    });

    emitSupportMessage(req.app.get('io'), conversationId, created);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};


