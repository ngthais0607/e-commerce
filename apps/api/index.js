import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { config } from './src/config/index.js';
import { testConnection } from './src/config/database.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import couponRoutes from './src/routes/couponRoutes.js';
import addressRoutes from './src/routes/addressRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import bannerRoutes from './src/routes/bannerRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/users', userRoutes);

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
