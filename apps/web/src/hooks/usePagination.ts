import { useState, useCallback, useMemo } from 'react';
import {
  PaginationParams,
  PaginationMeta,
  createPaginationMeta,
  validatePaginationParams,
  calculateOffset,
} from '@/utils/pagination';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

/**
 * Custom hook for managing pagination state
 * 
 * @param options - Pagination configuration
 * @returns Pagination state and controls
 * 
 * @example
 * const {
 *   page,
 *   limit,
 *   setPage,
 *   setLimit,
 *   meta,
 *   paginationParams,
 * } = usePagination({
 *   initialPage: 1,
 *   initialLimit: 10,
 *   total: 100,
 * });
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    total = 0,
    onPageChange,
    onLimitChange,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const setPage = useCallback(
    (newPage: number) => {
      const validated = validatePaginationParams(newPage, limit);
      setPageState(validated.page);
      onPageChange?.(validated.page);
    },
    [limit, onPageChange]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      const validated = validatePaginationParams(page, newLimit);
      setLimitState(validated.limit);
      onLimitChange?.(validated.limit);
      // Reset to page 1 when limit changes
      if (validated.limit !== limit) {
        setPageState(1);
      }
    },
    [page, limit, onLimitChange]
  );

  const meta = useMemo(
    () => createPaginationMeta(page, limit, total),
    [page, limit, total]
  );

  const paginationParams = useMemo(
    (): PaginationParams => ({
      page,
      limit,
      offset: calculateOffset(page, limit),
    }),
    [page, limit]
  );

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);
  const goToLastPage = useCallback(() => setPage(meta.totalPages), [setPage, meta.totalPages]);
  const goToNextPage = useCallback(() => {
    if (meta.hasNextPage) setPage(page + 1);
  }, [setPage, meta.hasNextPage, page]);
  const goToPreviousPage = useCallback(() => {
    if (meta.hasPreviousPage) setPage(page - 1);
  }, [setPage, meta.hasPreviousPage, page]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    meta,
    paginationParams,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  };
}

