/**
 * Database helper utilities to reduce code duplication
 */

/**
 * Build SQL UPDATE query dynamically from data object
 */
export const buildUpdateQuery = (
  data: Record<string, unknown>,
  fieldMap: Record<string, string> = {},
  excludeFields: string[] = ['id', 'createdAt']
): { fields: string[]; values: unknown[] } => {
  const fields: string[] = [];
  const values: unknown[] = [];

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
 * @param filters - Object containing filter conditions
 * @param fieldMap - Optional mapping of filter keys to SQL column names
 * @returns Object with WHERE clause and parameters
 */
/** Accepts any object used as filter (specific interfaces like ProductListFilters are allowed) */
export const buildWhereClause = (
  filters: Record<string, unknown> | object,
  fieldMap: Record<string, string> = {}
): { clause: string; params: unknown[] } => {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const entries = Object.entries(filters as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue;
    }

    const fieldName = fieldMap[key] || key;

    // Handle different filter types
    if (Array.isArray(value)) {
      if (value.length > 0) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${fieldName} IN (${placeholders})`);
        params.push(...(Array.isArray(value) ? value : [value]));
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ('gte' in obj) {
        conditions.push(`${fieldName} >= ?`);
        params.push(obj.gte);
      } else if ('lte' in obj) {
        conditions.push(`${fieldName} <= ?`);
        params.push(obj.lte);
      } else if ('contains' in obj) {
        conditions.push(`${fieldName} LIKE ?`);
        params.push(`%${String(obj.contains)}%`);
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
 */
export const parseJsonFields = (row: Record<string, unknown> | null, jsonFields: string[]): Record<string, unknown> | null => {
  if (!row) return row;
  const parsed = { ...row };
  for (const field of jsonFields) {
    const val = parsed[field];
    if (typeof val === 'string') {
      try {
        parsed[field] = JSON.parse(val) as unknown;
      } catch {
        // keep original
      }
    }
  }
  return parsed;
};

/**
 * Parse JSON fields from array of database results
 */
export const parseJsonFieldsArray = (rows: Record<string, unknown>[], jsonFields: string[]): Record<string, unknown>[] => {
  return rows.map((row) => parseJsonFields(row, jsonFields) as Record<string, unknown>);
};

