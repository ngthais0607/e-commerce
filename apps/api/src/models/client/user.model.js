import { queryOne, execute } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';

export const userProfileModel = {
  async update(id, data) {
    const updateFields = [];
    const updateValues = [];

    if (data.name) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(data.phone);
    }
    if (data.password) {
      updateFields.push('password = ?');
      updateValues.push(await hashPassword(data.password));
    }

    if (updateFields.length === 0) {
      // No fields to update, return current user
      return queryOne(
        `SELECT id, email, name, phone, role, isActive FROM clients WHERE id = ? AND isActive = 1`,
        [id]
      );
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await execute(
      `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ? AND isActive = 1`,
      updateValues
    );

    return queryOne(
      `SELECT id, email, name, phone, role, isActive FROM clients WHERE id = ? AND isActive = 1`,
      [id]
    );
  },
};


