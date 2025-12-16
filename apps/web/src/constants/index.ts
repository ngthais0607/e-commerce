// App Constants
export const APP_NAME = 'E-Commerce';
export const APP_VERSION = '1.0.0';

// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products',
    BY_SLUG: '/products/slug',
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories',
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders',
    CREATE: '/orders',
  },
  CART: {
    LIST: '/cart',
    ADD: '/cart',
    UPDATE: '/cart',
    REMOVE: '/cart',
  },
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
  },
  BANNERS: {
    LIST: '/banners',
  },
  COUPONS: {
    LIST: '/coupons',
    VALIDATE: '/coupons/validate',
  },
  ADDRESSES: {
    LIST: '/addresses',
    CREATE: '/addresses',
    UPDATE: '/addresses',
    DELETE: '/addresses',
  },
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  PRODUCT: '/product',
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/register',
  ACCOUNT: '/account',
  ORDERS: '/orders',
  CONTACT: '/contact',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ADMIN: '/admin',
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

// Validation Constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  AUTH_STORAGE: 'auth-storage',
  CART_STORAGE: 'cart-storage',
} as const;

