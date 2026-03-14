import mysql from 'mysql2/promise';
import { config } from './index.js';
import { log } from '../utils/logger.js';

// Parse DATABASE_URL: mysql://user:password@host:port/database
const parseDatabaseUrl = (url: string) => {
  try {
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    return {
      host: match[3],
      port: parseInt(match[4], 10),
      user: match[1],
      password: match[2],
      database: match[5],
    };
  } catch {
    // Fallback: try to parse as standard format
    const urlObj = new URL(url.replace('mysql://', 'http://'));
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '3306', 10),
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1),
    };
  }
};

const dbConfig = config.database.url
  ? parseDatabaseUrl(config.database.url)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce',
    };

// Create connection pool
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query string
 * @param params - Query parameters (primitives for prepared statements)
 * @returns {Promise<T[]>} Array of result rows
 * @throws {Error} If query execution fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async <T = any>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> => {
  const startTime = Date.now();
  try {
    const [rows] = await pool.execute(sql, params);
    const duration = Date.now() - startTime;
    
    // Log slow queries in development
    if (duration > 100 && process.env.NODE_ENV === 'development') {
      log.warn('Slow query detected', {
        duration: `${duration}ms`,
        sql: sql.substring(0, 200), // Truncate long queries
        params: params?.length || 0,
      });
    }
    
    return rows as T[];
  } catch (error) {
    log.error('Database query error', error as Error, { 
      sql: sql.substring(0, 200), 
      params,
      duration: `${Date.now() - startTime}ms`,
    });
    throw error;
  }
};

/**
 * Execute a query and return first row
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const queryOne = async <T = any>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T | null> => {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Execute an insert query and return the insert ID
 * @param {string} sql - SQL INSERT query string
 * @param params - Query parameters
 * @returns {Promise<number>} Insert ID of the new record
 * @throws {Error} If insert fails
 */
export const insert = async (
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<number> => {
  const startTime = Date.now();
  try {
    const [result] = await pool.execute(sql, params) as [mysql.ResultSetHeader, unknown];
    const duration = Date.now() - startTime;
    
    if (duration > 100 && process.env.NODE_ENV === 'development') {
      log.warn('Slow insert detected', {
        duration: `${duration}ms`,
        table: sql.match(/INSERT INTO (\w+)/i)?.[1],
      });
    }
    
    return result.insertId;
  } catch (error) {
    log.error('Database insert error', error as Error, { 
      sql: sql.substring(0, 200), 
      params,
      duration: `${Date.now() - startTime}ms`,
    });
    throw error;
  }
};

/**
 * Execute an update/delete query and return affected rows
 * @param {string} sql - SQL UPDATE/DELETE query string
 * @param params - Query parameters
 * @returns {Promise<number>} Number of affected rows
 * @throws {Error} If execution fails
 */
export const execute = async (
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<number> => {
  const startTime = Date.now();
  try {
    const [result] = await pool.execute(sql, params) as [mysql.ResultSetHeader, unknown];
    const duration = Date.now() - startTime;
    
    if (duration > 100 && process.env.NODE_ENV === 'development') {
      log.warn('Slow update/delete detected', {
        duration: `${duration}ms`,
        affectedRows: result.affectedRows,
        operation: sql.match(/^(UPDATE|DELETE)/i)?.[1],
      });
    }
    
    return result.affectedRows;
  } catch (error) {
    log.error('Database execute error', error as Error, { 
      sql: sql.substring(0, 200), 
      params,
      duration: `${Date.now() - startTime}ms`,
    });
    throw error;
  }
};

/**
 * Begin a transaction
 */
export const beginTransaction = async (): Promise<mysql.PoolConnection> => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Commit a transaction
 */
export const commit = async (connection: mysql.PoolConnection): Promise<void> => {
  await connection.commit();
  connection.release();
};

/**
 * Rollback a transaction
 */
export const rollback = async (connection: mysql.PoolConnection): Promise<void> => {
  await connection.rollback();
  connection.release();
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.execute('SELECT 1');
    log.info('Database connected successfully');
    return true;
  } catch (error) {
    log.error('Database connection failed', error as Error);
    return false;
  }
};

/**
 * Ping database for health check (no log, fast)
 */
export const pingDatabase = async (): Promise<boolean> => {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    log.info('Database disconnected');
  } catch (error) {
    log.error('Error disconnecting database', error as Error);
  }
};

export default pool;
