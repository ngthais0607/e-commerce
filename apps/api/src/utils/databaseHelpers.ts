/**
 * Database helper utilities to reduce code duplication
 */

/**
 * Build SQL UPDATE query dynamically from data object
 * @param {Record<string, any>} data - Object containing fields to update
 * @param {Record<string, string>} fieldMap - Optional mapping of data keys to SQL column names
 * @param {Array<string>} excludeFields - Fields to exclude from update
 * @returns {{ fields: string[], values: any[] }} Object with SQL fields and values
 * @example
 * const { fields, values } = buildUpdateQuery(
 *   { name: 'John', email: 'john@example.com' },
 *   {},
 *   ['id']
 * );
 * // Returns: { fields: ['name = ?', 'email = ?'], values: ['John', 'john@example.com'] }
 */
export const buildUpdateQuery = (
  data: Record<string, any>,
  fieldMap: Record<string, string> = {},
  excludeFields: string[] = ['id', 'createdAt']
): { fields: string[]; values: any[] } => {
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values and excluded fields
    if (value === undefined || excludeFields.includes(key)) {
      continue;
    }

    // Use mapped field name if provided, otherwise use key
    const fieldName = fieldMap[key] || key;
    fields.push(`${fieldName} = ?`);
    values.push(value);
  }

  return { fields, values };
};

/**
 * Build WHERE clause dynamically from filters
 * @param {Record<string, any>} filters - Object containing filter conditions
 * @param {Record<string, string>} fieldMap - Optional mapping of filter keys to SQL column names
 * @returns {{ clause: string, params: any[] }} Object with WHERE clause and parameters
 * @example
 * const { clause, params } = buildWhereClause(
 *   { status: 'active', categoryId: 1 },
 *   { categoryId: 'category_id' }
 * );
 * // Returns: { clause: "WHERE status = ? AND category_id = ?", params: ['active', 1] }
 */
export const buildWhereClause = (
  filters: Record<string, any>,
  fieldMap: Record<string, string> = {}
): { clause: string; params: any[] } => {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) {
      continue;
    }

    const fieldName = fieldMap[key] || key;

    // Handle different filter types
    if (Array.isArray(value)) {
      if (value.length > 0) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${fieldName} IN (${placeholders})`);
        params.push(...value);
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle operators like { gte: 100 }, { contains: 'text' }
      if ('gte' in value) {
        conditions.push(`${fieldName} >= ?`);
        params.push(value.gte);
      } else if ('lte' in value) {
        conditions.push(`${fieldName} <= ?`);
        params.push(value.lte);
      } else if ('contains' in value) {
        conditions.push(`${fieldName} LIKE ?`);
        params.push(`%${value.contains}%`);
      }
    } else {
      conditions.push(`${fieldName} = ?`);
      params.push(value);
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : 'WHERE 1=1';
  return { clause, params };
};

/**
 * Build pagination parameters
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {{ limit: number, offset: number }} Object with LIMIT and OFFSET values
 */
export const buildPagination = (page: number = 1, pageSize: number = 10): { limit: number; offset: number } => {
  const limit = Math.max(1, Math.min(pageSize, 100)); // Max 100 items per page
  const offset = Math.max(0, (page - 1) * limit);
  return { limit, offset };
};

/**
 * Parse JSON fields from database result
 * @param {any} row - Database row object
 * @param {string[]} jsonFields - Array of field names that contain JSON
 * @returns {any} Row with parsed JSON fields
 */
export const parseJsonFields = (row: any, jsonFields: string[]): any => {
  if (!row) return row;

  const parsed = { ...row };
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // If parsing fails, keep original value
      }
    }
  }
  return parsed;
};

/**
 * Parse JSON fields from array of database results
 * @param {any[]} rows - Array of database row objects
 * @param {string[]} jsonFields - Array of field names that contain JSON
 * @returns {any[]} Array of rows with parsed JSON fields
 */
export const parseJsonFieldsArray = (rows: any[], jsonFields: string[]): any[] => {
  return rows.map(row => parseJsonFields(row, jsonFields));
};

