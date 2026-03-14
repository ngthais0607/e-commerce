import type { ProductListFilters } from '../../types/models.js';
import { query, queryOne, insert, execute } from '../../config/database.js';
import { cacheWrapper, generateCacheKey, deleteCachePattern, CACHE_KEYS } from '../../utils/cache.js';

/**
 * Product data layer for admin scope
 */
export const adminProductModel = {
  async list(filters: ProductListFilters = {}) {
    const cacheKey = generateCacheKey(CACHE_KEYS.PRODUCTS, filters);
    
    return cacheWrapper(cacheKey, async () => {
      const {
        page = 1,
        pageSize = 12,
        categoryId,
        search,
        minPrice,
        maxPrice,
        brand,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive,
      } = filters;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (categoryId) {
        whereClause += ' AND p.categoryId = ?';
        params.push(categoryId);
      }

      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.shortDesc LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (minPrice !== undefined) {
        whereClause += ' AND p.price >= ?';
        params.push(minPrice);
      }

      if (maxPrice !== undefined) {
        whereClause += ' AND p.price <= ?';
        params.push(maxPrice);
      }

      if (brand) {
        whereClause += ' AND p.brand = ?';
        params.push(brand);
      }

      if (isActive !== undefined) {
        whereClause += ' AND p.isActive = ?';
        params.push(isActive ? 1 : 0);
      }

      // Get total count (use same whereClause but with products table alias)
      const [totalResult] = await query(
        `SELECT COUNT(*) as total FROM products p ${whereClause}`,
        params
      );
      const total = totalResult.total;

      // Build ORDER BY clause
      const validSortBy = ['createdAt', 'name', 'price', 'rating', 'reviewCount'];
      const sortColumn = validSortBy.includes(sortBy) ? sortBy : 'createdAt';
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Get products with category
      // Không cần lọc lại params – mảng `params` luôn khớp với số lượng dấu `?` trong whereClause
      const MAX_PAGE_SIZE = 100;
      const limitValue = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(pageSize), 10) || 12));
      const offsetValue = Math.max(0, (parseInt(String(page), 10) || 1) - 1) * limitValue;

      const sql = `SELECT 
          p.*,
          c.id as category_id,
          c.name as category_name,
          c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        ${whereClause}
        ORDER BY p.${sortColumn} ${sortDirection}
        LIMIT ${limitValue} OFFSET ${offsetValue}`;
      const items = await query(sql, params);

      // Transform results to match expected format
      const transformedItems = items.map(item => {
        const product = {
          id: item.id,
          name: item.name,
          slug: item.slug,
          shortDesc: item.shortDesc,
          description: item.description,
          price: parseFloat(item.price),
          salePrice: item.salePrice ? parseFloat(item.salePrice) : null,
          stock: item.stock,
          sku: item.sku,
          images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
          attributes: item.attributes ? (typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes) : null,
          categoryId: item.categoryId,
          brand: item.brand,
          rating: parseFloat(item.rating),
          reviewCount: item.reviewCount,
          isActive: Boolean(item.isActive),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          category: item.category_id ? {
            id: item.category_id,
            name: item.category_name,
            slug: item.category_slug,
          } : null,
        };
        return product;
      });

      return {
        items: transformedItems,
        total,
        page: Math.max(1, parseInt(String(page), 10) || 1),
        pageSize: limitValue,
        totalPages: Math.ceil(total / limitValue),
      };
    }, 300); // 5 minutes cache
  },

  async getById(id: number) {
    const cacheKey = `${CACHE_KEYS.PRODUCT}:${id}`;
    
    return cacheWrapper(cacheKey, async () => {
      const product = await queryOne(
        `SELECT 
          p.*,
          c.id as category_id,
          c.name as category_name,
          c.slug as category_slug,
          c.description as category_description
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE p.id = ?`,
        [id]
      );

      if (!product) return null;

      // Get reviews with user info
      const reviews = await query(
        `SELECT 
          r.id,
          r.rating,
          r.title,
          r.comment,
          r.isVerified,
          r.createdAt,
          cl.id as user_id,
          cl.name as user_name
        FROM reviews r
        LEFT JOIN clients cl ON r.clientId = cl.id
        WHERE r.productId = ?
        ORDER BY r.createdAt DESC
        LIMIT 10`,
        [id]
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDesc: product.shortDesc,
        description: product.description,
        price: parseFloat(product.price),
        salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
        stock: product.stock,
        sku: product.sku,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        attributes: product.attributes ? (typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes) : null,
        categoryId: product.categoryId,
        brand: product.brand,
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount,
        isActive: Boolean(product.isActive),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category_id ? {
          id: product.category_id,
          name: product.category_name,
          slug: product.category_slug,
          description: product.category_description,
        } : null,
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerified: Boolean(r.isVerified),
          createdAt: r.createdAt,
          user: r.user_id ? {
            id: r.user_id,
            name: r.user_name,
          } : null,
        })),
      };
    }, 600); // 10 minutes cache
  },

  async getBySlug(slug: string) {
    const cacheKey = `${CACHE_KEYS.PRODUCT}:slug:${slug}`;
    
    return cacheWrapper(cacheKey, async () => {
      const product = await queryOne(
        `SELECT 
          p.*,
          c.id as category_id,
          c.name as category_name,
          c.slug as category_slug,
          c.description as category_description
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE p.slug = ?`,
        [slug]
      );

      if (!product) return null;

      // Get reviews with user info
      const reviews = await query(
        `SELECT 
          r.id,
          r.rating,
          r.title,
          r.comment,
          r.isVerified,
          r.createdAt,
          cl.id as user_id,
          cl.name as user_name
        FROM reviews r
        LEFT JOIN clients cl ON r.clientId = cl.id
        WHERE r.productId = ?
        ORDER BY r.createdAt DESC`,
        [product.id]
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDesc: product.shortDesc,
        description: product.description,
        price: parseFloat(product.price),
        salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
        stock: product.stock,
        sku: product.sku,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        attributes: product.attributes ? (typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes) : null,
        categoryId: product.categoryId,
        brand: product.brand,
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount,
        isActive: Boolean(product.isActive),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category_id ? {
          id: product.category_id,
          name: product.category_name,
          slug: product.category_slug,
          description: product.category_description,
        } : null,
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerified: Boolean(r.isVerified),
          createdAt: r.createdAt,
          user: r.user_id ? {
            id: r.user_id,
            name: r.user_name,
          } : null,
        })),
      };
    }, 600); // 10 minutes cache
  },

  async create(data: Record<string, unknown>) {
    const productId = await insert(
      `INSERT INTO products (
        name, slug, shortDesc, description, price, salePrice, stock, sku, 
        images, attributes, categoryId, brand, rating, reviewCount, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW())`,
      [
        data.name,
        data.slug,
        data.shortDesc || null,
        data.description || null,
        data.price,
        data.salePrice || null,
        data.stock || 0,
        data.sku || null,
        JSON.stringify(data.images || []),
        data.attributes ? JSON.stringify(data.attributes) : null,
        data.categoryId,
        data.brand || null,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );

    // Invalidate product list cache
    await deleteCachePattern(`${CACHE_KEYS.PRODUCTS}:*`);

    return this.getById(productId);
  },

  async update(id: number, data: Record<string, unknown>) {
    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.slug !== undefined) {
      updateFields.push('slug = ?');
      updateValues.push(data.slug);
    }
    if (data.shortDesc !== undefined) {
      updateFields.push('shortDesc = ?');
      updateValues.push(data.shortDesc);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }
    if (data.price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(data.price);
    }
    if (data.salePrice !== undefined) {
      updateFields.push('salePrice = ?');
      updateValues.push(data.salePrice);
    }
    if (data.stock !== undefined) {
      updateFields.push('stock = ?');
      updateValues.push(data.stock);
    }
    if (data.sku !== undefined) {
      updateFields.push('sku = ?');
      updateValues.push(data.sku);
    }
    if (data.images !== undefined) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(data.images));
    }
    if (data.attributes !== undefined) {
      updateFields.push('attributes = ?');
      updateValues.push(data.attributes ? JSON.stringify(data.attributes) : null);
    }
    if (data.categoryId !== undefined) {
      updateFields.push('categoryId = ?');
      updateValues.push(data.categoryId);
    }
    if (data.brand !== undefined) {
      updateFields.push('brand = ?');
      updateValues.push(data.brand);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id);

      await execute(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Invalidate caches for this product
    await deleteCachePattern(`${CACHE_KEYS.PRODUCT}:${id}*`);
    await deleteCachePattern(`${CACHE_KEYS.PRODUCTS}:*`);

    return this.getById(id);
  },

  async remove(id: number) {
    const affectedRows = await execute(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );

    // Invalidate caches
    await deleteCachePattern(`${CACHE_KEYS.PRODUCT}:${id}*`);
    await deleteCachePattern(`${CACHE_KEYS.PRODUCTS}:*`);

    return affectedRows > 0;
  },
};
