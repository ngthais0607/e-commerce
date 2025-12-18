import { useState, useCallback } from 'react';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

/**
 * Custom hook for retrying failed async operations
 * 
 * @param asyncFn - The async function to retry
 * @param options - Retry configuration
 * @returns [execute, isRetrying, retryCount]
 * 
 * @example
 * const [execute, isRetrying, retryCount] = useRetry(
 *   () => api.get('/products'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * 
 * const handleLoad = async () => {
 *   try {
 *     const data = await execute();
 *     setProducts(data);
 *   } catch (error) {
 *     // All retries failed
 *   }
 * };
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const execute = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          onRetry?.(attempt);
          await sleep(retryDelay);
        }

        const result = await asyncFn();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, don't retry
        if (attempt === maxRetries) {
          setIsRetrying(false);
          onMaxRetriesReached?.();
          throw lastError;
        }
      }
    }

    setIsRetrying(false);
    throw lastError || new Error('Unknown error');
  }, [asyncFn, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

  return [execute, isRetrying, retryCount] as const;
}

