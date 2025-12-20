import { query, queryOne, insert, execute } from '../../config/database.js';

export const adminBannerModel = {
  async list(filters = {}) {
    const { position, includeInactive } = filters;
    
    let sql = `SELECT * FROM banners WHERE 1=1`;
    const params = [];

    if (position) {
      sql += ` AND position = ?`;
      params.push(position);
    }

    if (!includeInactive) {
      sql += ` AND isActive = 1`;
    }

    sql += ` ORDER BY sortOrder ASC, createdAt DESC`;

    return query(sql, params);
  },

  async create(data) {
    const bannerId = await insert(
      `INSERT INTO banners (title, image, link, position, isActive, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.title,
        data.image,
        data.link || null,
        data.position,
        data.isActive !== undefined ? data.isActive : true,
        data.sortOrder || 0,
      ]
    );

    return queryOne(
      `SELECT * FROM banners WHERE id = ?`,
      [bannerId]
    );
  },

  async update(id, data) {
    const updateFields = [];
    const updateValues = [];

    if (data.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }
    if (data.image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(data.image);
    }
    if (data.link !== undefined) {
      updateFields.push('link = ?');
      updateValues.push(data.link);
    }
    if (data.position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(data.position);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }
    if (data.sortOrder !== undefined) {
      updateFields.push('sortOrder = ?');
      updateValues.push(data.sortOrder);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await execute(
      `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return queryOne(
      `SELECT * FROM banners WHERE id = ?`,
      [id]
    );
  },

  async getById(id) {
    return queryOne(
      `SELECT * FROM banners WHERE id = ?`,
      [id]
    );
  },

  async remove(id) {
    const affectedRows = await execute(
      `DELETE FROM banners WHERE id = ?`,
      [id]
    );
    return affectedRows > 0;
  },
};


