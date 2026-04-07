import type { ReviewListFilters, ReviewCreateData, ReviewUpdateData } from '../../types/models.js';
import { query, queryOne, insert, execute } from '../../config/database.js';
import { deleteCache, deleteCachePattern } from '../../utils/cache.js';

const invalidateProductCache = async (productId: number): Promise<void> => {
  const productRow = await queryOne<{ slug: string }>(
    `SELECT slug FROM products WHERE id = ?`,
    [productId]
  );
  await deleteCache(`product:${productId}`);
  if (productRow?.slug) {
    await deleteCache(`product:slug:${productRow.slug}`);
  }
  await deleteCachePattern('products:*');
};

const recalcProductRating = async (productId: number): Promise<void> => {
  const reviews = await query(
    `SELECT rating FROM reviews WHERE productId = ?`,
    [productId]
  );

  if (reviews.length === 0) {
    await execute(
      `UPDATE products SET rating = 0, reviewCount = 0, updatedAt = NOW() WHERE id = ?`,
      [productId]
    );
  } else {
    const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;
    await execute(
      `UPDATE products SET rating = ?, reviewCount = ?, updatedAt = NOW() WHERE id = ?`,
      [avgRating.toFixed(2), reviews.length, productId]
    );
  }

  await invalidateProductCache(productId);
};

export const reviewModel = {
  async list(filters: ReviewListFilters = {}) {
    const { productId, page = 1, pageSize = 10 } = filters;
    const MAX_PAGE_SIZE = 100;
    const limitValue = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(pageSize), 10) || 10));
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const offsetValue = (pageNum - 1) * limitValue;

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
      LIMIT ${limitValue} OFFSET ${offsetValue}`,
      params
    );

    return {
      items: reviews.map(review => ({
        id: review.id,
        clientId: review.clientId,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        adminReply: review.adminReply ?? null,
        adminRepliedAt: review.adminRepliedAt ?? null,
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
      page: pageNum,
      pageSize: limitValue,
      totalPages: Math.ceil(total / limitValue),
    };
  },

  async findUnique(where: { id?: number; clientId?: number; productId?: number }) {
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
      `SELECT id, clientId, productId, rating, title, comment, adminReply, adminRepliedAt, isVerified, createdAt, updatedAt FROM reviews ${whereClause}`,
      params
    );
  },

  async create(clientId: number, data: ReviewCreateData) {
    const { productId, rating, title, comment } = data;

    // Check if user has purchased this product
    // NOTE: query() trả về mảng các dòng, không destructure phần tử đầu tiên
    const purchasedRows = await query(
      `SELECT oi.id 
       FROM order_items oi
       INNER JOIN orders o ON oi.orderId = o.id
       WHERE oi.productId = ? AND o.clientId = ? AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
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
      adminReply: review.adminReply ?? null,
      adminRepliedAt: review.adminRepliedAt ?? null,
      isVerified: Boolean(review.isVerified),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user_id ? {
        id: review.user_id,
        name: review.user_name,
      } : null,
    };
  },

  async update(id: number, data: ReviewUpdateData) {
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

    if (updated && (updated as { productId?: number }).productId != null) {
      await recalcProductRating((updated as { productId: number }).productId);
    }

    return this.findUnique({ id });
  },

  async remove(id: number) {
    // Get review to get productId before deleting
    const review = await queryOne(
      `SELECT productId FROM reviews WHERE id = ?`,
      [id]
    );

    const affectedRows = await execute(
      `DELETE FROM reviews WHERE id = ?`,
      [id]
    );

    if (review && affectedRows > 0 && (review as { productId?: number }).productId != null) {
      await recalcProductRating((review as { productId: number }).productId);
    }

    return affectedRows > 0;
  },

  async replyToReview(id: number, reply: string | null) {
    await execute(
      `UPDATE reviews SET adminReply = ?, adminRepliedAt = IF(? IS NULL, NULL, NOW(3)), updatedAt = NOW() WHERE id = ?`,
      [reply, reply, id]
    );
    const updated = await this.findUnique({ id });
    if (updated && (updated as { productId?: number }).productId) {
      await invalidateProductCache((updated as { productId: number }).productId);
    }
    return updated;
  },

  async listAll(filters: { page?: number; pageSize?: number; productId?: number } = {}) {
    const { page = 1, pageSize = 20, productId } = filters;
    const MAX_PAGE_SIZE = 100;
    const limitValue = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(pageSize), 10) || 20));
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const offsetValue = (pageNum - 1) * limitValue;

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];

    if (productId) {
      whereClause += ' AND r.productId = ?';
      params.push(productId);
    }

    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      params
    );
    const total = totalResult.total;

    const reviews = await query(
      `SELECT r.*, cl.id as user_id, cl.name as user_name, p.id as product_id, p.name as product_name
       FROM reviews r
       LEFT JOIN clients cl ON r.clientId = cl.id
       LEFT JOIN products p ON r.productId = p.id
       ${whereClause}
       ORDER BY r.createdAt DESC
       LIMIT ${limitValue} OFFSET ${offsetValue}`,
      params
    );

    return {
      items: reviews.map(review => ({
        id: review.id,
        clientId: review.clientId,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        adminReply: review.adminReply ?? null,
        adminRepliedAt: review.adminRepliedAt ?? null,
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
      page: pageNum,
      pageSize: limitValue,
      totalPages: Math.ceil(total / limitValue),
    };
  },
};
