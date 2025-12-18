import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Global error handler middleware
 * Handles all errors and returns appropriate HTTP responses
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with context
  log.error('Request error', err, {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    body: config.nodeEnv === 'development' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      ...(config.nodeEnv === 'development' && { details: err.details }),
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      error: 'Foreign key constraint',
      message: 'Cannot perform this operation due to related records',
    });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      error: 'Database error',
      message: 'Invalid database field',
      ...(config.nodeEnv === 'development' && { details: err.message }),
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid input data',
      details: err.errors,
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = config.nodeEnv === 'development';

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && {
      stack: err.stack,
      details: err,
    }),
    ...(!isDevelopment && statusCode === 500 && {
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
    }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

