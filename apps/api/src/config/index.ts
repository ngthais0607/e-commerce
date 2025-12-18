import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: Number(process.env.PORT) || 4000,
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Database - MySQL connection
  database: {
    url: process.env.DATABASE_URL as string,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ecommerce',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Security
  bcrypt: {
    saltRounds: 12,
  },

  // Payment
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE || '',
      secretKey: process.env.VNPAY_SECRET_KEY || '',
      url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/callback',
    },
  },
} as const;

