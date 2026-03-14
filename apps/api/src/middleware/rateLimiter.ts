import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // In development allow many more attempts to avoid blocking yourself while testing
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin routes in development
    if (process.env.NODE_ENV === 'development' && req.path?.startsWith('/api/admin')) {
      return true;
    }
    return false;
  },
});

