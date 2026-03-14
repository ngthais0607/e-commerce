import type { UserListFilters } from '../../types/models.js';
import { query, queryOne, execute } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';

export const adminUserModel = {
  async list(filters: UserListFilters = {}) {
    const { page = 1, pageSize = 20, role, search } = filters;

    // Ensure page and pageSize are valid numbers
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.max(1, Math.min(50, parseInt(String(pageSize), 10) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM clients ${whereClause}`,
      params
    );
    const total = totalResult?.total || 0;

    // Get users with order count
    // Use template string for LIMIT/OFFSET to avoid parameter binding issues
    // Sort: ADMIN first, then STAFF, then CUSTOMER, then by creation date
    const users = await query(
      `SELECT 
        c.id,
        c.email,
        c.name,
        c.phone,
        c.role,
        c.isActive,
        c.createdAt,
        c.customerCode,
        COALESCE(COUNT(o.id), 0) as orderCount
      FROM clients c
      LEFT JOIN orders o ON c.id = o.clientId
      ${whereClause}
      GROUP BY c.id, c.email, c.name, c.phone, c.role, c.isActive, c.createdAt
      ORDER BY 
        CASE c.role
          WHEN 'ADMIN' THEN 1
          WHEN 'STAFF' THEN 2
          WHEN 'CUSTOMER' THEN 3
          ELSE 4
        END,
        c.createdAt DESC
      LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params
    );

    return {
      items: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: Boolean(user.isActive),
        createdAt: user.createdAt,
        customerCode: user.customerCode,
        _count: {
          orders: parseInt(user.orderCount, 10) || 0,
        },
      })),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };
  },

  async getById(id: number) {
    return queryOne(
      `SELECT id, email, name, phone, role, isActive, createdAt, customerCode 
       FROM clients WHERE id = ?`,
      [id]
    );
  },

  async update(id: number, data: Record<string, unknown>) {
    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(data.email);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(data.phone);
    }
    if (data.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(data.role);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }
    if (data.password) {
      updateFields.push('password = ?');
      updateValues.push(await hashPassword(String(data.password)));
    }

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id);

      await execute(
        `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    return this.getById(id);
  },

  async updateRole(id: number, role: string, isActive?: boolean) {
    const updateFields = [];
    const updateValues = [];

    updateFields.push('role = ?');
    updateValues.push(role);

    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await execute(
      `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return this.getById(id);
  },
};
