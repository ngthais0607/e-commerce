/**
 * URL utilities
 * Provides functions for working with URLs and query parameters
 */

/**
 * Parse query string to object
 * 
 * @param queryString - Query string (with or without ?)
 * @returns Object with query parameters
 * 
 * @example
 * parseQueryString('?page=1&limit=10') // { page: '1', limit: '10' }
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString.replace(/^\?/, ''));
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Build query string from object
 * 
 * @param params - Object with query parameters
 * @returns Query string
 * 
 * @example
 * buildQueryString({ page: 1, limit: 10 }) // '?page=1&limit=10'
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Update URL query parameters without page reload
 * 
 * @param params - Object with query parameters to update
 * @param replace - Whether to replace current history entry
 * 
 * @example
 * updateQueryParams({ page: 2 }, false);
 */
export function updateQueryParams(
  params: Record<string, unknown>,
  replace: boolean = false
): void {
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
}

/**
 * Get query parameter value
 * 
 * @param key - Query parameter key
 * @param defaultValue - Default value if not found
 * @returns Query parameter value or default
 * 
 * @example
 * getQueryParam('page', '1') // '1' or value from URL
 */
export function getQueryParam(key: string, defaultValue?: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) || defaultValue || null;
}

/**
 * Get all query parameters
 * 
 * @returns Object with all query parameters
 */
export function getAllQueryParams(): Record<string, string> {
  return parseQueryString(window.location.search);
}

/**
 * Remove query parameter from URL
 * 
 * @param key - Query parameter key to remove
 */
export function removeQueryParam(key: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  window.history.pushState({}, '', url);
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    // If invalid URL, try to make it valid
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }
}

