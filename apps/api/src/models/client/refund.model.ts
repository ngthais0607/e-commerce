import { query, queryOne, insert, execute } from '../../config/database.js';

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RefundRequest {
  id: number;
  orderId: number;
  clientId: number;
  reason: string;
  status: RefundStatus;
  adminNote: string | null;
  requestedAt: Date;
  resolvedAt: Date | null;
  order?: { orderNumber: string; total: number };
  client?: { name: string; email: string };
}

export const refundModel = {
  async findById(id: number): Promise<RefundRequest | null> {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT rr.id, rr.orderId, rr.clientId, rr.reason, rr.status, rr.adminNote, rr.requestedAt, rr.resolvedAt,
              o.orderNumber, o.total as orderTotal, cl.name as clientName, cl.email as clientEmail
       FROM refund_requests rr
       JOIN orders o ON rr.orderId = o.id
       JOIN clients cl ON rr.clientId = cl.id
       WHERE rr.id = ?`,
      [id]
    );
    if (!row) return null;
    return {
      id: row.id as number,
      orderId: row.orderId as number,
      clientId: row.clientId as number,
      reason: row.reason as string,
      status: row.status as RefundStatus,
      adminNote: (row.adminNote ?? null) as string | null,
      requestedAt: row.requestedAt as Date,
      resolvedAt: (row.resolvedAt ?? null) as Date | null,
      order: { orderNumber: row.orderNumber as string, total: Number(row.orderTotal) },
      client: { name: row.clientName as string, email: row.clientEmail as string },
    };
  },

  async findByOrder(orderId: number): Promise<RefundRequest | null> {
    return queryOne<RefundRequest>(
      `SELECT id, orderId, clientId, reason, status, adminNote, requestedAt, resolvedAt
       FROM refund_requests WHERE orderId = ? ORDER BY requestedAt DESC LIMIT 1`,
      [orderId]
    );
  },

  async create(orderId: number, clientId: number, reason: string): Promise<RefundRequest> {
    const id = await insert(
      `INSERT INTO refund_requests (orderId, clientId, reason, status, requestedAt)
       VALUES (?, ?, ?, 'PENDING', NOW(3))`,
      [orderId, clientId, reason]
    );
    return queryOne<RefundRequest>(
      `SELECT id, orderId, clientId, reason, status, adminNote, requestedAt, resolvedAt
       FROM refund_requests WHERE id = ?`,
      [id]
    ) as Promise<RefundRequest>;
  },

  async listAll(filters: { page?: number; pageSize?: number; status?: string } = {}) {
    const { page = 1, pageSize = 20, status } = filters;
    const limit = Math.min(100, Math.max(1, pageSize));
    const offset = (Math.max(1, page) - 1) * limit;

    const where = status ? 'WHERE rr.status = ?' : '';
    const params: unknown[] = status ? [status] : [];

    const [countRow] = await query(
      `SELECT COUNT(*) as total FROM refund_requests rr ${where}`,
      params
    );

    const rows = await query(
      `SELECT rr.*, o.orderNumber, o.total as orderTotal, cl.name as clientName, cl.email as clientEmail
       FROM refund_requests rr
       JOIN orders o ON rr.orderId = o.id
       JOIN clients cl ON rr.clientId = cl.id
       ${where}
       ORDER BY rr.requestedAt DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      items: rows.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        clientId: r.clientId,
        reason: r.reason,
        status: r.status as RefundStatus,
        adminNote: r.adminNote ?? null,
        requestedAt: r.requestedAt,
        resolvedAt: r.resolvedAt ?? null,
        order: { orderNumber: r.orderNumber, total: Number(r.orderTotal) },
        client: { name: r.clientName, email: r.clientEmail },
      })),
      total: countRow.total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(countRow.total / limit),
    };
  },

  async resolve(
    id: number,
    status: 'APPROVED' | 'REJECTED',
    adminNote?: string
  ): Promise<RefundRequest | null> {
    await execute(
      `UPDATE refund_requests
       SET status = ?, adminNote = ?, resolvedAt = NOW(3)
       WHERE id = ?`,
      [status, adminNote ?? null, id]
    );
    return queryOne<RefundRequest>(
      `SELECT id, orderId, clientId, reason, status, adminNote, requestedAt, resolvedAt
       FROM refund_requests WHERE id = ?`,
      [id]
    );
  },
};
