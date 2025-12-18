// App Configuration
export const config = {
  api: {
    // Sử dụng relative URL để dùng Vite proxy trong development
    // Hoặc absolute URL nếu có VITE_API_URL trong .env
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
  },
  app: {
    name: 'Stay',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },
  features: {
    enableReviews: true,
    enableCoupons: true,
  },
} as const;

export default config;

