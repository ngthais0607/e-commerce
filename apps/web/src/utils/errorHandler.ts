import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Standardizes error handling across the application
 * Extracts meaningful error messages from API responses
 */
export function handleApiError(error: unknown): ApiError {
  // Axios error
  if (error instanceof AxiosError) {
    const response = error.response;
    const request = error.request;

    // Server responded with error
    if (response) {
      const errorMessage =
        (response.data as { error?: string })?.error ||
        (response.data as { message?: string })?.message ||
        response.statusText ||
        'An error occurred';

      return {
        message: errorMessage,
        status: response.status,
        code: response.data?.code,
        details: response.data,
      };
    }

    // Request made but no response received
    if (request) {
      return {
        message: 'Network error. Please check your connection and try again.',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    }

    // Error in request setup
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'REQUEST_ERROR',
    };
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Formats error message for display to users
 */
export function formatErrorMessage(error: ApiError): string {
  // Don't expose technical details in production
  const isDevelopment = import.meta.env.MODE === 'development';

  if (error.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.status === 422) {
    return error.message || 'Invalid input. Please check your data and try again.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  // In development, show full error message
  if (isDevelopment && error.details) {
    return `${error.message}\n\nDetails: ${JSON.stringify(error.details, null, 2)}`;
  }

  return error.message || 'An error occurred. Please try again.';
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && error.request;
  }
  return false;
}

/**
 * Checks if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED' || error.message.includes('timeout');
  }
  return false;
}

