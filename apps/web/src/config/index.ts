// App Configuration (VITE_* from .env – see .env.example)
export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
  },
  app: {
    name: 'Stay',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },
  features: {
    enableReviews: import.meta.env.VITE_ENABLE_REVIEWS !== 'false',
    enableCoupons: import.meta.env.VITE_ENABLE_COUPONS !== 'false',
  },
} as const;

export default config;

