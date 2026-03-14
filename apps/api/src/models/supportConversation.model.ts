import { query, queryOne, insert, execute } from '../config/database.js';

export const supportConversationModel = {
  async createOrGetOpenByUser(userId: number) {
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

  async getById(id: number) {
    return queryOne(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE id = ?`,
      [id]
    );
  },

  async listByUser(userId: number) {
    return query(
      `SELECT id, userId, status, assignedStaffId, lastMessageAt, createdAt, updatedAt
       FROM support_conversations
       WHERE userId = ?
       ORDER BY lastMessageAt DESC`,
      [userId]
    );
  },

  async listByStatus(statuses: string[] = ['OPEN', 'ASSIGNED']) {
    const placeholders = statuses.map(() => '?').join(',');
    return query(
      `SELECT sc.id, sc.userId, sc.status, sc.assignedStaffId, sc.lastMessageAt, sc.createdAt, sc.updatedAt,
              c.name AS userName, c.email AS userEmail
       FROM support_conversations sc
       LEFT JOIN clients c ON sc.userId = c.id
       WHERE sc.status IN (${placeholders})
       ORDER BY sc.lastMessageAt DESC`,
      statuses
    );
  },

  async assign(conversationId: number, staffId: number) {
    await execute(
      `UPDATE support_conversations
       SET status = 'ASSIGNED', assignedStaffId = ?, updatedAt = NOW()
       WHERE id = ?`,
      [staffId, conversationId]
    );
    return this.getById(conversationId);
  },

  async close(conversationId: number) {
    await execute(
      `UPDATE support_conversations
       SET status = 'CLOSED', updatedAt = NOW()
       WHERE id = ?`,
      [conversationId]
    );
    return this.getById(conversationId);
  },

  async touch(conversationId: number) {
    await execute(
      `UPDATE support_conversations
       SET lastMessageAt = NOW(), updatedAt = NOW()
       WHERE id = ?`,
      [conversationId]
    );
  },
};


