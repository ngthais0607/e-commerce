import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  enabled?: boolean; // Enable/disable infinite scroll
  rootMargin?: string; // IntersectionObserver rootMargin
}

/**
 * Custom hook for infinite scroll functionality
 * Automatically loads more data when user scrolls near the bottom
 * 
 * @param onLoadMore - Callback function to load more data
 * @param hasMore - Whether there is more data to load
 * @param loading - Whether data is currently loading
 * @param options - Configuration options
 * 
 * @example
 * const { ref, isFetching } = useInfiniteScroll(
 *   () => loadMoreProducts(),
 *   hasMoreProducts,
 *   isLoading
 * );
 * 
 * return <div ref={ref}>Content</div>;
 */
export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  hasMore: boolean,
  loading: boolean = false,
  options: UseInfiniteScrollOptions = {}
) {
  const {
    threshold = 200,
    enabled = true,
    rootMargin = '0px',
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async () => {
    if (loading || isFetching || !hasMore) return;

    setIsFetching(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsFetching(false);
    }
  }, [onLoadMore, hasMore, loading, isFetching]);

  useEffect(() => {
    if (!enabled || !hasMore || loading || isFetching) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px ${rootMargin}`,
        threshold: 0.1,
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [enabled, hasMore, loading, isFetching, threshold, rootMargin, handleLoadMore]);

  return {
    ref: observerTarget,
    isFetching,
  };
}

