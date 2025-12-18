import { log } from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with method, URL, status, and response time
 * Also tracks performance metrics
 */
export const requestLogger = (req, res, next) => {
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
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
      rss: `${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2)}MB`,
    };

    const logLevel = res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warn') : 'http';

    const logData = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
    };

    // Add performance warnings for slow requests
    if (duration > 1000) {
      logData.performanceWarning = 'Slow request detected';
    }

    // Add memory info for development
    if (process.env.NODE_ENV === 'development') {
      logData.memory = memoryDelta;
    }

    log[logLevel]('Request completed', logData);

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

