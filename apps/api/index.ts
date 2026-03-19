import express from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { config } from './src/config/index.js';
import { log } from './src/utils/logger.js';
import { testConnection, pingDatabase } from './src/config/database.js';
import { initRedis, closeRedis, pingRedis } from './src/config/redis.js';
import { initEmail } from './src/config/email.js';
import { swaggerSpec } from './src/config/swagger.js';
import { initSocket } from './src/realtime/socket.js';

// Client-facing routes
import clientAuthRoutes from './src/routes/client/auth.routes.js';
import clientProductRoutes from './src/routes/client/product.routes.js';
import clientCategoryRoutes from './src/routes/client/category.routes.js';
import clientOrderRoutes from './src/routes/client/order.routes.js';
import clientReviewRoutes from './src/routes/client/review.routes.js';
import clientCouponRoutes from './src/routes/client/coupon.routes.js';
import clientAddressRoutes from './src/routes/client/address.routes.js';
import clientBannerRoutes from './src/routes/client/banner.routes.js';
import clientProfileRoutes from './src/routes/client/user.routes.js';
import clientPaymentRoutes from './src/routes/client/payment.routes.js';
import clientOrderMessageRoutes from './src/routes/client/orderMessage.routes.js';
import clientSupportRoutes from './src/routes/client/support.routes.js';

// Admin routes
import adminProductRoutes from './src/routes/admin/product.routes.js';
import adminCategoryRoutes from './src/routes/admin/category.routes.js';
import adminOrderRoutes from './src/routes/admin/order.routes.js';
import adminCouponRoutes from './src/routes/admin/coupon.routes.js';
import adminBannerRoutes from './src/routes/admin/banner.routes.js';
import adminUserRoutes from './src/routes/admin/user.routes.js';
import adminAddressRoutes from './src/routes/admin/address.routes.js';
import adminSupportRoutes from './src/routes/admin/support.routes.js';
import adminStaffDashboardRoutes from './src/routes/admin/staffDashboard.routes.js';
import adminUploadRoutes from './src/routes/admin/upload.routes.js';
import adminStatisticsRoutes from './src/routes/admin/statistics.routes.js';
import adminOrderMessageRoutes from './src/routes/admin/orderMessage.routes.js';

const app = express();
const server = http.createServer(app);
const PORT = config.port;

// Middleware
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || config.corsOrigin || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    // Non-browser clients (curl, server-to-server) may not send Origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) return callback(null, true);

    // Allow common Vercel preview/prod domains when wildcard is desired
    if (allowedOrigins.has('*')) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Request logging (before rate limiter to log all requests)
app.use(requestLogger);

// Apply rate limiting to all API routes (except admin in development)
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
} else {
  app.use('/api', (req, res, next) => {
    if (req.path?.startsWith('/admin')) {
      return next();
    }
    return apiLimiter(req, res, next);
  });
}

// Health check (DB + Redis for monitoring/load balancer)
app.get('/health', async (_req, res) => {
  const timestamp = new Date().toISOString();
  const [database, redis] = await Promise.all([pingDatabase(), pingRedis()]);
  const ok = database;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    timestamp,
    database: database ? 'ok' : 'error',
    redis: redis ? 'ok' : 'unavailable',
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Stay API Documentation',
}));

// Client API Routes
app.use('/api/auth', clientAuthRoutes);
app.use('/api/products', clientProductRoutes);
app.use('/api/categories', clientCategoryRoutes);
app.use('/api/orders', clientOrderRoutes);
app.use('/api/reviews', clientReviewRoutes);
app.use('/api/coupons', clientCouponRoutes);
app.use('/api/addresses', clientAddressRoutes);
app.use('/api/banners', clientBannerRoutes);
app.use('/api/clients', clientProfileRoutes);
app.use('/api/payments', clientPaymentRoutes);
app.use('/api', clientOrderMessageRoutes);
app.use('/api/support', clientSupportRoutes);

// Admin API Routes
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/addresses', adminAddressRoutes);
app.use('/api/admin/upload', adminUploadRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);
app.use('/api/admin', adminOrderMessageRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/admin/staff', adminStaffDashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  // Validate production env and log startup (thống nhất qua logger)
  if (config.nodeEnv === 'production') {
    const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      log.error('Missing required environment variables in production', null, { missingVars });
      log.error('Set these variables before starting the server', null, {});
      process.exit(1);
    }
    if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      log.warn('Using default JWT_SECRET in production is insecure', {
        hint: 'Set a strong, random JWT_SECRET in .env',
      });
    }
  }

  const dbConnected = await testConnection();
  if (!dbConnected) {
    log.error('Failed to connect to database', null, {
      message: 'Please check your DATABASE_URL in .env',
    });
    process.exit(1);
  }

  try {
    await initRedis();
  } catch (error) {
    log.warn('Redis not available - app will run without caching', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  initEmail();

  const io = initSocket(server);
  app.set('io', io);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log.error('Port already in use', null, {
        port: PORT,
        message: `Cổng ${PORT} đang được sử dụng. Tắt process đang dùng cổng này hoặc đổi PORT trong file .env (ví dụ: PORT=4001)`,
        hint: 'Windows: netstat -ano | findstr :' + PORT + ' rồi taskkill /PID <pid> /F',
      });
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => {
    log.info('Server started', {
      port: PORT,
      environment: config.nodeEnv,
      corsOrigin: config.corsOrigin,
    });
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
});

startServer();

export { app, server };
