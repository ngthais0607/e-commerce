/**
 * Pagination utilities
 * Provides helpers for handling paginated data
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total items and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Create pagination meta from response
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = calculateTotalPages(total, limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Validate pagination params
 */
export function validatePaginationParams(
  page: number,
  limit: number,
  maxLimit: number = 100
): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit) || 10));
  
  return {
    page: validPage,
    limit: validLimit,
  };
}

/**
 * Generate pagination range for display
 * Returns array of page numbers to show
 */
export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Create URL query string for pagination
 */
export function createPaginationQuery(params: PaginationParams): string {
  const { page, limit } = params;
  return `page=${page}&limit=${limit}`;
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationFromURL(
  searchParams: URLSearchParams,
  defaultLimit: number = 10
): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  
  return validatePaginationParams(page, limit);
}

