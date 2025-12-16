import { useState, useEffect, useCallback } from 'react';

interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for handling async operations with loading and error states
 * Provides a clean way to manage async data fetching in components
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { immediate = true, onSuccess, onError } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      throw err;
    }
  }, [asyncFunction, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount if immediate is true

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

