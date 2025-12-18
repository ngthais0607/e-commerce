import { query, queryOne, insert } from '../../config/database.js';

export const orderMessageModel = {
  async listByOrder(orderId) {
    const messages = await query(
      `SELECT id, orderId, clientId, staffId, senderRole, message, createdAt
       FROM order_messages
       WHERE orderId = ?
       ORDER BY createdAt ASC`,
      [orderId]
    );

    return messages;
  },

  async createMessage({ orderId, clientId = null, staffId = null, senderRole, message }) {
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


