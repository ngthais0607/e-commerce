import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If hashing fails
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password to compare
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} If comparison fails
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

