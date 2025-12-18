import axios, { AxiosError } from 'axios';
import { config } from '@/config';
import { STORAGE_KEYS } from '@/constants';
import { handleApiError, formatErrorMessage } from '@/utils/errorHandler';

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    // Don't add token for auth endpoints (login, register)
    if (
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register')
    ) {
      delete config.headers.Authorization;
      return config;
    }

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = handleApiError(error);

    // Handle 401 Unauthorized - Token expired or invalid
    if (apiError.status === 401) {
      // Clear all auth data
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
      
      // Only redirect if not already on login/register page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }

    // Log error in development
    if (config.app.environment === 'development') {
      console.error('API Error:', {
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
        details: apiError.details,
      });
    }

    // In production, you could send to error tracking service
    // Example: Sentry.captureException(error, { extra: apiError });

    // Reject with standardized error
    return Promise.reject(apiError);
  }
);

// Export helper function for components to use
export { formatErrorMessage, handleApiError };

export default api;

