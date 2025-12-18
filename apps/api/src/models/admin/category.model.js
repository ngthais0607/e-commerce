import { query, queryOne, insert, execute } from '../../config/database.js';
import { cacheWrapper, generateCacheKey, deleteCachePattern, CACHE_KEYS } from '../../utils/cache.js';

export const adminCategoryModel = {
  async list(includeInactive = true, filters = {}) {
    const { page, pageSize, search, parentId } = filters;
    
    // Use cache for category listings (10 minutes TTL - categories change less frequently)
    const cacheKey = generateCacheKey(CACHE_KEYS.CATEGORIES, { includeInactive, ...filters });
    
    return cacheWrapper(cacheKey, async () => {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (!includeInactive) {
        whereClause += ` AND isActive = 1`;
      }

      if (search) {
        whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      if (parentId !== undefined) {
        whereClause += ` AND parentId ${parentId === null ? 'IS NULL' : '= ?'}`;
        if (parentId !== null) {
          params.push(parentId);
        }
      }

      // If pagination is requested, return paginated results
      if (page !== undefined && pageSize !== undefined) {
        const [totalResult] = await query(
          `SELECT COUNT(*) as total FROM categories ${whereClause}`,
          params
        );
        const total = totalResult.total;

        const items = await query(
          `SELECT 
            c.*,
            (SELECT COUNT(*) FROM products WHERE categoryId = c.id AND isActive = 1) as productCount
          FROM categories c
          ${whereClause}
          ORDER BY c.name ASC
          LIMIT ? OFFSET ?`,
          [...params, pageSize, (page - 1) * pageSize]
        );

        // Get parent and children for each category
        const itemsWithRelations = await Promise.all(
          items.map(async (item) => {
            const [parent, children] = await Promise.all([
              item.parentId ? queryOne(`SELECT id, name, slug FROM categories WHERE id = ?`, [item.parentId]) : null,
              query(`SELECT id, name, slug FROM categories WHERE parentId = ?`, [item.id]),
            ]);

            return {
              ...item,
              parent,
              children,
              _count: {
                products: item.productCount || 0,
              },
            };
          })
        );

        return {
          items: itemsWithRelations,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }

      // Otherwise, return all results (backward compatibility)
      const items = await query(
        `SELECT 
          c.*,
          (SELECT COUNT(*) FROM products WHERE categoryId = c.id AND isActive = 1) as productCount
        FROM categories c
        ${whereClause}
        ORDER BY c.name ASC`,
        params
      );

      // Get parent and children for each category
      const itemsWithRelations = await Promise.all(
        items.map(async (item) => {
          const [parent, children] = await Promise.all([
            item.parentId ? queryOne(`SELECT id, name, slug FROM categories WHERE id = ?`, [item.parentId]) : null,
            query(`SELECT id, name, slug FROM categories WHERE parentId = ?`, [item.id]),
          ]);

          return {
            ...item,
            parent,
            children,
            _count: {
              products: item.productCount || 0,
            },
          };
        })
      );

      return itemsWithRelations;
    }, 600); // 10 minutes cache
  },

  async getById(id) {
    const cacheKey = `${CACHE_KEYS.CATEGORY}:${id}`;
    
    return cacheWrapper(cacheKey, async () => {
      const category = await queryOne(
        `SELECT * FROM categories WHERE id = ?`,
        [id]
      );

      if (!category) return null;

      const [parent, children, products] = await Promise.all([
        category.parentId ? queryOne(`SELECT id, name, slug FROM categories WHERE id = ?`, [category.parentId]) : null,
        query(`SELECT id, name, slug FROM categories WHERE parentId = ?`, [id]),
        query(
          `SELECT id, name, slug, price, salePrice, images 
           FROM products 
           WHERE categoryId = ? AND isActive = 1 
           LIMIT 10`,
          [id]
        ),
      ]);

      return {
        ...category,
        parent,
        children,
        products,
      };
    }, 600); // 10 minutes cache
  },

  async getBySlug(slug) {
    const cacheKey = `${CACHE_KEYS.CATEGORY}:slug:${slug}`;
    
    return cacheWrapper(cacheKey, async () => {
      return queryOne(
        `SELECT * FROM categories WHERE slug = ?`,
        [slug]
      );
    }, 600); // 10 minutes cache
  },

  async findBySlugExcludingId(slug, id) {
    return queryOne(
      `SELECT * FROM categories WHERE slug = ? AND id != ?`,
      [slug, id]
    );
  },

  async create(data) {
    const categoryId = await insert(
      `INSERT INTO categories (name, slug, description, image, parentId, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.name,
        data.slug,
        data.description || null,
        data.image || null,
        data.parentId || null,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );

    const category = await this.getById(categoryId);
    
    // Invalidate category list cache
    await deleteCachePattern(`${CACHE_KEYS.CATEGORIES}:*`);
    
    return category;
  },

  async update(id, data) {
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
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }
    if (data.image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(data.image);
    }
    if (data.parentId !== undefined) {
      updateFields.push('parentId = ?');
      updateValues.push(data.parentId);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id);

      await execute(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const category = await this.getById(id);
    
    // Invalidate caches for this category
    await deleteCachePattern(`${CACHE_KEYS.CATEGORY}:${id}*`);
    await deleteCachePattern(`${CACHE_KEYS.CATEGORIES}:*`);
    
    return category;
  },

  async remove(id) {
    const affectedRows = await execute(
      `DELETE FROM categories WHERE id = ?`,
      [id]
    );
    
    // Invalidate caches
    await deleteCachePattern(`${CACHE_KEYS.CATEGORY}:${id}*`);
    await deleteCachePattern(`${CACHE_KEYS.CATEGORIES}:*`);
    
    return affectedRows > 0;
  },
};
