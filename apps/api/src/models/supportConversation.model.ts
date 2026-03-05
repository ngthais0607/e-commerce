import { query, queryOne, insert, execute } from '../config/database.js';

export const supportConversationModel = {
  async createOrGetOpenByUser(userId) {
    const existing = await queryOne(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE userId = ? AND status IN ('OPEN', 'ASSIGNED')
       ORDER BY createdAt DESC
       LIMIT 1`,
      [userId]
    );

    if (existing) return existing;

    const id = await insert(
      `INSERT INTO support_conversations (userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt)
       VALUES (?, 'OPEN', NULL, NOW(), NOW(), NOW())`,
      [userId]
    );

    return this.getById(id);
  },

  async getById(id) {
    return queryOne(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE id = ?`,
      [id]
    );
  },

  async listByUser(userId) {
    return query(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE userId = ?
       ORDER BY lastMessageAt DESC`,
      [userId]
    );
  },

  async listByStatus(statuses = ['OPEN', 'ASSIGNED']) {
    const placeholders = statuses.map(() => '?').join(',');
    return query(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE status IN (${placeholders})
       ORDER BY lastMessageAt DESC`,
      statuses
    );
  },

  async assign(conversationId, staffId) {
    await execute(
      `UPDATE support_conversations
       SET status = 'ASSIGNED', assignedStaffId = ?, updatedAt = NOW()
       WHERE id = ?`,
      [staffId, conversationId]
    );
    return this.getById(conversationId);
  },

  async close(conversationId) {
    await execute(
      `UPDATE support_conversations
       SET status = 'CLOSED', updatedAt = NOW()
       WHERE id = ?`,
      [conversationId]
    );
    return this.getById(conversationId);
  },

  async touch(conversationId) {
    await execute(
      `UPDATE support_conversations
       SET lastMessageAt = NOW(), updatedAt = NOW()
       WHERE id = ?`,
      [conversationId]
    );
  },
};


