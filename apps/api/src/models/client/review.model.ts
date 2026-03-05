import { query, queryOne, insert, execute } from '../../config/database.js';

const recalcProductRating = async (productId) => {
  const reviews = await query(
    `SELECT rating FROM reviews WHERE productId = ?`,
    [productId]
  );

  if (reviews.length === 0) {
    await execute(
      `UPDATE products SET rating = 0, reviewCount = 0, updatedAt = NOW() WHERE id = ?`,
      [productId]
    );
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;

  await execute(
    `UPDATE products SET rating = ?, reviewCount = ?, updatedAt = NOW() WHERE id = ?`,
    [avgRating.toFixed(2), reviews.length, productId]
  );
};

export const reviewModel = {
  async list(filters = {}) {
    const { productId, page = 1, pageSize = 10 } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (productId) {
      whereClause += ' AND r.productId = ?';
      params.push(productId);
    }

    // Get total count
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      params
    );
    const total = totalResult.total;

    // Get reviews with user and product info
    const reviews = await query(
      `SELECT 
        r.*,
        cl.id as user_id,
        cl.name as user_name,
        p.id as product_id,
        p.name as product_name
      FROM reviews r
      LEFT JOIN clients cl ON r.clientId = cl.id
      LEFT JOIN products p ON r.productId = p.id
      ${whereClause}
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return {
      items: reviews.map(review => ({
        id: review.id,
        clientId: review.clientId,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerified: Boolean(review.isVerified),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: review.user_id ? {
          id: review.user_id,
          name: review.user_name,
        } : null,
        product: review.product_id ? {
          id: review.product_id,
          name: review.product_name,
        } : null,
      })),
      total,
      page,
      pageSize,
    };
  },

  async findUnique(where) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (where.id) {
      whereClause += ' AND id = ?';
      params.push(where.id);
    }
    if (where.clientId && where.productId) {
      whereClause += ' AND clientId = ? AND productId = ?';
      params.push(where.clientId, where.productId);
    }

    return queryOne(
      `SELECT * FROM reviews ${whereClause}`,
      params
    );
  },

  async create(clientId, data) {
    const { productId, rating, title, comment } = data;

    // Check if user has purchased this product
    // NOTE: query() trả về mảng các dòng, không destructure phần tử đầu tiên
    const purchasedRows = await query(
      `SELECT oi.id 
       FROM order_items oi
       INNER JOIN orders o ON oi.orderId = o.id
       WHERE oi.productId = ? AND o.clientId = ? AND o.status IN ('COMPLETED', 'SHIPPED')
       LIMIT 1`,
      [productId, clientId]
    );
    const hasPurchased = purchasedRows.length > 0;

    if (!hasPurchased) {
      const error = new Error('You can only review products you have purchased');
      // Use generic error branch in errorHandler with 400 status
      error.name = 'CustomValidationError';
      // @ts-expect-error - allow dynamic property for error status
      error.status = 400;
      throw error;
    }

    // Create review
    const reviewId = await insert(
      `INSERT INTO reviews (clientId, productId, rating, title, comment, isVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        clientId,
        productId,
        rating,
        title || null,
        comment || null,
        hasPurchased ? 1 : 0,
      ]
    );

    // Recalculate product rating
    await recalcProductRating(productId);

    // Get created review with user info
    const review = await queryOne(
      `SELECT 
        r.*,
        cl.id as user_id,
        cl.name as user_name
      FROM reviews r
      LEFT JOIN clients cl ON r.clientId = cl.id
      WHERE r.id = ?`,
      [reviewId]
    );

    return {
      id: review.id,
      clientId: review.clientId,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: Boolean(review.isVerified),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user_id ? {
        id: review.user_id,
        name: review.user_name,
      } : null,
    };
  },

  async update(id, data) {
    const updateFields = [];
    const updateValues = [];

    if (data.rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(data.rating);
    }
    if (data.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }
    if (data.comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(data.comment);
    }

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id);

      await execute(
        `UPDATE reviews SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Get updated review to get productId
    const updated = await queryOne(
      `SELECT productId FROM reviews WHERE id = ?`,
      [id]
    );

    if (updated) {
      await recalcProductRating(updated.productId);
    }

    return this.findUnique({ id });
  },

  async remove(id) {
    // Get review to get productId before deleting
    const review = await queryOne(
      `SELECT productId FROM reviews WHERE id = ?`,
      [id]
    );

    const affectedRows = await execute(
      `DELETE FROM reviews WHERE id = ?`,
      [id]
    );

    if (review && affectedRows > 0) {
      await recalcProductRating(review.productId);
    }

    return affectedRows > 0;
  },
};
