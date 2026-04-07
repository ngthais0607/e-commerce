import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

interface ErrorWithDetails extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  details?: unknown;
  errors?: unknown;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: ErrorWithDetails,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
  if (err.name === 'CustomValidationError') {
    res.status(err.status || 400).json({
      error: err.message,
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      message: err.message,
      ...(config.nodeEnv === 'development' && { details: err.details }),
    });
    return;
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }

  if (err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
    });
    return;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(400).json({
      error: 'Foreign key constraint',
      message: 'Cannot perform this operation due to related records',
    });
    return;
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    res.status(500).json({
      error: 'Database error',
      message: 'Invalid database field',
      ...(config.nodeEnv === 'development' && { details: err.message }),
    });
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({
      error: 'Validation error',
      message: 'Invalid input data',
      details: err.errors,
    });
    return;
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

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};

