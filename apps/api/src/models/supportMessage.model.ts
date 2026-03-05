import { query, queryOne, insert } from '../config/database.js';
import { supportConversationModel } from './supportConversation.model.js';

export interface CreateSupportMessageParams {
  conversationId: number;
  senderRole: string;
  userId?: number | null;
  staffId?: number | null;
  message: string;
}

export const supportMessageModel = {
  async listByConversation(conversationId: number) {
    return query(
      `SELECT id, conversationId, senderRole, userId, staffId, message, createdAt
       FROM support_messages
       WHERE conversationId = ?
       ORDER BY createdAt ASC`,
      [conversationId]
    );
  },

  async createMessage({ conversationId, senderRole, userId = null, staffId = null, message }: CreateSupportMessageParams) {
    const id = await insert(
      `INSERT INTO support_messages (conversationId, senderRole, userId, staffId, message, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [conversationId, senderRole, userId, staffId, message]
    );

    await supportConversationModel.touch(conversationId);

    return queryOne(
      `SELECT id, conversationId, senderRole, userId, staffId, message, createdAt
       FROM support_messages
       WHERE id = ?`,
      [id]
    );
  },
};


