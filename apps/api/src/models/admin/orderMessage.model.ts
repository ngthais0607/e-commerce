import { query, queryOne, insert } from '../../config/database.js';

export interface CreateMessageParams {
  orderId: number;
  clientId?: number | null;
  staffId?: number | null;
  senderRole: string;
  message: string;
}

export const orderMessageModel = {
  async listByOrder(orderId: number) {
    const messages = await query(
      `SELECT id, orderId, clientId, staffId, senderRole, message, createdAt
       FROM order_messages
       WHERE orderId = ?
       ORDER BY createdAt ASC`,
      [orderId]
    );

    return messages;
  },

  async createMessage({ orderId, clientId = null, staffId = null, senderRole, message }: CreateMessageParams) {
    const messageId = await insert(
      `INSERT INTO order_messages (orderId, clientId, staffId, senderRole, message, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, clientId, staffId, senderRole, message]
    );

    const created = await queryOne(
      `SELECT id, orderId, clientId, staffId, senderRole, message, createdAt
       FROM order_messages
       WHERE id = ?`,
      [messageId]
    );

    return created;
  },
};


