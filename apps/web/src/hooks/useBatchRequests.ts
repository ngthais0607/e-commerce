import { useCallback, useRef } from 'react';

interface BatchRequest<T> {
  id: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface BatchOptions {
  maxBatchSize?: number;
  batchDelay?: number;
}

/**
 * Custom hook for batching multiple API requests into a single request
 * Useful for reducing network overhead when making multiple similar requests
 * 
 * @param batchFn - Function that processes a batch of requests
 * @param options - Batch configuration options
 * @returns Function to add request to batch
 * 
 * @example
 * const addToBatch = useBatchRequests(
 *   async (requests) => {
 *     const response = await api.post('/batch', { requests });
 *     return response.data;
 *   },
 *   { maxBatchSize: 10, batchDelay: 100 }
 * );
 * 
 * const loadProduct = async (id: string) => {
 *   return new Promise((resolve, reject) => {
 *     addToBatch(id, () => api.get(`/products/${id}`), resolve, reject);
 *   });
 * };
 */
export function useBatchRequests<T, R = T>(
  batchFn: (requests: Array<{ id: string; request: () => Promise<T> }>) => Promise<R[]>,
  options: BatchOptions = {}
) {
  const { maxBatchSize = 10, batchDelay = 100 } = options;
  const batchRef = useRef<BatchRequest<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    const currentBatch = batchRef.current.splice(0, maxBatchSize);
    const requests = currentBatch.map((item) => ({
      id: item.id,
      request: item.request,
    }));

    try {
      const results = await batchFn(requests);
      
      // Resolve each promise with corresponding result
      currentBatch.forEach((item, index) => {
        item.resolve(results[index] as T);
      });
    } catch (error) {
      // Reject all promises in batch
      const err = error instanceof Error ? error : new Error(String(error));
      currentBatch.forEach((item) => {
        item.reject(err);
      });
    }

    // Process remaining items if any
    if (batchRef.current.length > 0) {
      timeoutRef.current = setTimeout(processBatch, batchDelay);
    }
  }, [batchFn, maxBatchSize, batchDelay]);

  const addToBatch = useCallback(
    (
      id: string,
      request: () => Promise<T>,
      resolve: (value: T) => void,
      reject: (error: Error) => void
    ) => {
      batchRef.current.push({ id, request, resolve, reject });

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Process batch if it reaches max size
      if (batchRef.current.length >= maxBatchSize) {
        processBatch();
      } else {
        // Otherwise, wait for batchDelay before processing
        timeoutRef.current = setTimeout(processBatch, batchDelay);
      }
    },
    [processBatch, maxBatchSize, batchDelay]
  );

  return addToBatch;
}

