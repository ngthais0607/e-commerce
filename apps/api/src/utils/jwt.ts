import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;

/**
 * Generate a JWT access token for a user
 * @param {number} userId - User ID to include in token
 * @returns {string} JWT token string
 * @throws {Error} If token generation fails
 */
export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
};

/**
 * Generate a JWT refresh token for a user
 * @param {number} userId - User ID to include in token
 * @returns {string} JWT refresh token string
 * @throws {Error} If token generation fails
 */
export const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions);
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string to verify
 * @returns {{ userId: number; exp?: number; iat?: number; type?: string }} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token: string): { userId: number; exp?: number; iat?: number; type?: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: number; exp?: number; iat?: number; type?: string };
};

