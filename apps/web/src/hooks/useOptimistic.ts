import { useState, useCallback, useRef } from 'react';

interface OptimisticOptions<T> {
  onError?: (error: Error, rollbackValue: T) => void;
  onSuccess?: (result: T) => void;
}

/**
 * Custom hook for optimistic UI updates
 * Updates UI immediately, then rolls back if the operation fails
 * 
 * @param initialValue - Initial value
 * @param options - Optional callbacks
 * @returns [value, setOptimisticValue, isPending]
 * 
 * @example
 * const [items, setOptimisticItems, isPending] = useOptimistic(initialItems);
 * 
 * const addItem = async (newItem) => {
 *   setOptimisticItems([...items, newItem]);
 *   try {
 *     const result = await api.post('/items', newItem);
 *     setOptimisticItems(result.data);
 *   } catch (error) {
 *     // Automatically rolls back on error
 *   }
 * };
 */
export function useOptimistic<T>(
  initialValue: T,
  options: OptimisticOptions<T> = {}
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const previousValueRef = useRef<T>(initialValue);

  const setOptimisticValue = useCallback(
    async (newValue: T, asyncOperation?: () => Promise<T>) => {
      // Store previous value for rollback
      previousValueRef.current = value;
      
      // Update UI immediately (optimistic update)
      setValue(newValue);
      setIsPending(true);

      // If async operation provided, execute it
      if (asyncOperation) {
        try {
          const result = await asyncOperation();
          setValue(result);
          setIsPending(false);
          options.onSuccess?.(result);
        } catch (error) {
          // Rollback on error
          setValue(previousValueRef.current);
          setIsPending(false);
          const err = error instanceof Error ? error : new Error(String(error));
          options.onError?.(err, previousValueRef.current);
          throw error;
        }
      } else {
        setIsPending(false);
      }
    },
    [value, options]
  );

  return [value, setOptimisticValue, isPending];
}

