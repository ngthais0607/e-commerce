import express from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { config } from './src/config/index.js';
import { testConnection } from './src/config/database.js';
import { initRedis, closeRedis } from './src/config/redis.js';
import { initEmail } from './src/config/email.js';
import { swaggerSpec } from './src/config/swagger.js';
import { log } from './src/utils/logger.js';
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
import adminSupportRoutes from './src/routes/admin/support.routes.js';
import adminStaffDashboardRoutes from './src/routes/admin/staffDashboard.routes.js';

const app = express();
const server = http.createServer(app);
const PORT = config.port;

// Middleware
app.use(cors({ 
  origin: config.corsOrigin,
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Request logging (before rate limiter to log all requests)
app.use(requestLogger);

// Apply rate limiting to all API routes (except admin in development)
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
} else {
  // In development, only apply to non-admin routes
  app.use('/api', (req, res, next) => {
    if (req.path?.startsWith('/admin')) {
      return next();
    }
    return apiLimiter(req, res, next);
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
import adminUploadRoutes from './src/routes/admin/upload.routes.js';
import adminStatisticsRoutes from './src/routes/admin/statistics.routes.js';
import adminOrderMessageRoutes from './src/routes/admin/orderMessage.routes.js';

app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/upload', adminUploadRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);
app.use('/api/admin', adminOrderMessageRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/admin/staff', adminStaffDashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    log.error('Failed to connect to database', null, {
      message: 'Please check your DATABASE_URL in .env',
    });
    process.exit(1);
  }

  // Initialize Redis (non-blocking - app can run without Redis)
  try {
    await initRedis();
  } catch (error) {
    log.warn('Redis not available - app will run without caching', {
      message: error.message,
    });
  }

  // Initialize Email service
  initEmail();

  // Initialize Socket.IO and attach to app
  const io = initSocket(server);
  app.set('io', io);

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

// Export app and server for testing / Socket.IO
export { app, server };
