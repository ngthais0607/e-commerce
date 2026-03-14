import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with method, URL, status, and response time
 * Also tracks performance metrics
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Log request
  log.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Override res.end to log response with performance metrics
  const originalEnd = res.end.bind(res);
  res.end = function (
    this: Response,
    chunk?: unknown,
    encodingOrCb?: BufferEncoding | (() => void),
    cb?: () => void
  ): Response {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
      rss: `${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2)}MB`,
    };

    const logLevel = res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warn') : 'http';

    const logData: Record<string, unknown> = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
    };

    if (duration > 1000) {
      logData.performanceWarning = 'Slow request detected';
    }
    if (process.env.NODE_ENV === 'development') {
      logData.memory = memoryDelta;
    }

    if (logLevel === 'error') {
      log.error('Request completed', null, logData);
    } else if (logLevel === 'warn') {
      log.warn('Request completed', logData);
    } else {
      log.http('Request completed', logData);
    }

    const encoding = typeof encodingOrCb === 'function' ? undefined : encodingOrCb;
    const done = typeof encodingOrCb === 'function' ? encodingOrCb : cb;
    return originalEnd(chunk, encoding ?? ('utf-8' as BufferEncoding), done);
  };

  next();
};

