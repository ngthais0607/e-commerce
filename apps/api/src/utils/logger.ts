import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output (development)
const consoleFormat = printf(({ level, message, timestamp, ...metadata }: winston.Logform.TransformableInfo) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ],
});

// In production, also log to files
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  );
}

// Helper methods
export const log = {
  error: (message: string, error: Error | null, metadata: Record<string, unknown> = {}) => {
    logger.error(message, {
      ...metadata,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          ...(error && 'code' in error && { code: (error as { code?: string }).code }),
        },
      }),
    });
  },

  warn: (message: string, metadata: Record<string, unknown> = {}) => {
    logger.warn(message, metadata);
  },

  info: (message: string, metadata: Record<string, unknown> = {}) => {
    logger.info(message, metadata);
  },

  debug: (message: string, metadata: Record<string, unknown> = {}) => {
    logger.debug(message, metadata);
  },

  http: (message: string, metadata: Record<string, unknown> = {}) => {
    logger.http(message, metadata);
  },
};

export default logger;

