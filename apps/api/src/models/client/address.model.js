import { query, queryOne, insert, execute } from '../../config/database.js';

export const addressModel = {
  async listByUser(clientId) {
    return query(
      `SELECT * FROM addresses 
       WHERE clientId = ? 
       ORDER BY isDefault DESC, createdAt DESC`,
      [clientId]
    );
  },

  async findById(id) {
    return queryOne(
      `SELECT * FROM addresses WHERE id = ?`,
      [id]
    );
  },

  async unsetDefault(clientId, excludeId) {
    let sql = `UPDATE addresses SET isDefault = 0 WHERE clientId = ? AND isDefault = 1`;
    const params = [clientId];
    
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    
    await execute(sql, params);
  },

  async create(data) {
    const addressId = await insert(
      `INSERT INTO addresses (clientId, name, phone, address, city, district, ward, postalCode, isDefault, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.clientId || data.userId, // Support both clientId and userId for backward compatibility
        data.name,
        data.phone,
        data.address,
        data.city,
        data.district,
        data.ward,
        data.postalCode || null,
        data.isDefault || false,
      ]
    );

    return queryOne(
      `SELECT * FROM addresses WHERE id = ?`,
      [addressId]
    );
  },

  async update(id, data) {
    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(data.phone);
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(data.address);
    }
    if (data.city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(data.city);
    }
    if (data.district !== undefined) {
      updateFields.push('district = ?');
      updateValues.push(data.district);
    }
    if (data.ward !== undefined) {
      updateFields.push('ward = ?');
      updateValues.push(data.ward);
    }
    if (data.postalCode !== undefined) {
      updateFields.push('postalCode = ?');
      updateValues.push(data.postalCode);
    }
    if (data.isDefault !== undefined) {
      updateFields.push('isDefault = ?');
      updateValues.push(data.isDefault);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await execute(
      `UPDATE addresses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return this.findById(id);
  },

  async remove(id) {
    const affectedRows = await execute(
      `DELETE FROM addresses WHERE id = ?`,
      [id]
    );
    return affectedRows > 0;
  },
};


