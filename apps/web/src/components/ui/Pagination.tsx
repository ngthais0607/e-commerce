import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { generatePaginationRange, PaginationMeta } from '@/utils/pagination';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
  maxVisible?: number;
}

/**
 * Pagination component
 * Displays pagination controls for navigating through pages
 * 
 * @example
 * <Pagination
 *   meta={paginationMeta}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export function Pagination({
  meta,
  onPageChange,
  className,
  showFirstLast = true,
  maxVisible = 5,
}: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = meta;
  const pages = generatePaginationRange(page, totalPages, maxVisible);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* First page */}
      {showFirstLast && page > 1 && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          aria-label="Go to first page"
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -ml-2" />
        </Button>
      )}

      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        aria-label="Go to previous page"
        disabled={!hasPreviousPage}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages[0] > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            aria-label="Go to page 1"
          >
            1
          </Button>
          {pages[0] > 2 && (
            <span className="px-2">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
        </>
      )}

      {/* Page buttons */}
      {pages.map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === page ? 'default' : 'outline'}
          size="icon"
          onClick={() => onPageChange(pageNum)}
          aria-label={`Go to page ${pageNum}`}
          aria-current={pageNum === page ? 'page' : undefined}
        >
          {pageNum}
        </Button>
      ))}

      {/* Ellipsis and last page */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-2">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Go to page ${totalPages}`}
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        aria-label="Go to next page"
        disabled={!hasNextPage}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      {showFirstLast && page < totalPages && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          aria-label="Go to last page"
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-2" />
        </Button>
      )}
    </nav>
  );
}

