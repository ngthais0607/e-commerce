import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { config } from './src/config/index.js';
import { testConnection } from './src/config/database.js';

// User-facing routes
import userAuthRoutes from './src/routes/user/auth.routes.js';
import userProductRoutes from './src/routes/user/product.routes.js';
import userCategoryRoutes from './src/routes/user/category.routes.js';
import userOrderRoutes from './src/routes/user/order.routes.js';
import userReviewRoutes from './src/routes/user/review.routes.js';
import userCouponRoutes from './src/routes/user/coupon.routes.js';
import userAddressRoutes from './src/routes/user/address.routes.js';
import userWishlistRoutes from './src/routes/user/wishlist.routes.js';
import userBannerRoutes from './src/routes/user/banner.routes.js';
import userProfileRoutes from './src/routes/user/user.routes.js';

// Admin routes
import adminProductRoutes from './src/routes/admin/product.routes.js';
import adminCategoryRoutes from './src/routes/admin/category.routes.js';
import adminOrderRoutes from './src/routes/admin/order.routes.js';
import adminCouponRoutes from './src/routes/admin/coupon.routes.js';
import adminBannerRoutes from './src/routes/admin/banner.routes.js';
import adminUserRoutes from './src/routes/admin/user.routes.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({ 
  origin: config.corsOrigin,
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User API Routes
app.use('/api/auth', userAuthRoutes);
app.use('/api/products', userProductRoutes);
app.use('/api/categories', userCategoryRoutes);
app.use('/api/orders', userOrderRoutes);
app.use('/api/reviews', userReviewRoutes);
app.use('/api/coupons', userCouponRoutes);
app.use('/api/addresses', userAddressRoutes);
app.use('/api/wishlist', userWishlistRoutes);
app.use('/api/banners', userBannerRoutes);
app.use('/api/users', userProfileRoutes);

// Admin API Routes
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Please check your DATABASE_URL in .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔗 CORS Origin: ${config.corsOrigin}`);
  });
};

startServer();
