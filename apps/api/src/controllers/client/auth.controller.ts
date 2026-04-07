import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import crypto from 'crypto';
import { authClientModel } from '../../models/client/auth.model.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { authView } from '../../views/client/auth.view.js';
import { sendPasswordReset, sendOtpEmail } from '../../services/emailService.js';
import { getCache, setCache, deleteCache } from '../../utils/cache.js';
import { log } from '../../utils/logger.js';

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

/**
 * Register a new client
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Client email address
 * @param {string} req.body.password - Client password (min 6 characters)
 * @param {string} req.body.name - Client full name
 * @param {string} [req.body.phone] - Client phone number (optional)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = registerSchema.parse({ body: req.body }).body;

    const existingClient = await authClientModel.findByEmail(email);
    if (existingClient) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email address already exists.',
      });
    }

    const hashedPassword = await hashPassword(password);
    const client = await authClientModel.createClient({
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'CUSTOMER',
    });
    if (!client) {
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const token = generateToken(client.id);
    res.status(201).json(authView.authResponse({ user: client, token }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

/**
 * Login an existing client
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Client email address
 * @param {string} req.body.password - Client password
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse({ body: req.body }).body;

    const client = await authClientModel.findByEmailWithPassword(email);
    if (!client) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect.',
      });
    }

    if (!client.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    const isValid = await comparePassword(password, client!.password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect.',
      });
    }

    const token = generateToken(client.id);
    res.json(
      authView.authResponse({
        user: {
          id: client.id,
          email: client.email,
          name: client.name,
          role: client.role,
          customerCode: client.customerCode,
        },
        token,
      }),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

/**
 * Get current authenticated client profile
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (from auth middleware)
 * @param {number} req.user.id - Client ID
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const client = await authClientModel.findById(req.user!.id);
    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        message: 'Your account could not be found. Please contact support.',
      });
    }
    res.json(authView.profile(client as unknown as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
};

const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

/**
 * Request password reset - sends 6-digit OTP via email (stored in Redis for 5 minutes)
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = requestPasswordResetSchema.parse({ body: req.body }).body;

    const client = await authClientModel.findByEmail(email);
    if (!client) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If the email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis for 5 minutes
    const stored = await setCache(`otp:${email}`, { otp, clientId: client.id }, 300);
    if (!stored) {
      log.warn('Redis unavailable, falling back to DB token for password reset', { clientId: client.id });
      // Fallback to DB token if Redis is unavailable
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);
      await authClientModel.createResetToken(client.id, resetToken, resetTokenExpiry);
      await sendPasswordReset(client, resetToken).catch((e) =>
        log.error('Failed to send reset email', e instanceof Error ? e : null)
      );
      return res.json({ message: 'If the email exists, an OTP has been sent.' });
    }

    // Send OTP email
    await sendOtpEmail(client, otp).catch((e) =>
      log.error('Failed to send OTP email', e instanceof Error ? e : null, { clientId: client.id })
    );

    res.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({ field: err.path.join('.'), message: err.message })),
      });
    }
    log.error('Error in requestPasswordReset', error instanceof Error ? error : null);
    next(error);
  }
};

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

/**
 * Verify OTP and return a short-lived reset token (stored in Redis for 10 minutes)
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = verifyOtpSchema.parse({ body: req.body }).body;

    const cached = await getCache<{ otp: string; clientId: number }>(`otp:${email}`);
    if (!cached || cached.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
    }

    // OTP is correct - generate a short-lived reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await setCache(`reset_token:${resetToken}`, { clientId: cached.clientId }, 600); // 10 min
    await deleteCache(`otp:${email}`);

    res.json({ resetToken, message: 'OTP verified successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({ field: err.path.join('.'), message: err.message })),
      });
    }
    log.error('Error in verifyOtp', error instanceof Error ? error : null);
    next(error);
  }
};

const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().optional(), // from OTP flow (Redis)
    token: z.string().optional(),      // legacy DB token
    password: z.string().min(6),
  }),
});

/**
 * Reset password using either a Redis-backed OTP reset token or a legacy DB token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, token, password } = resetPasswordSchema.parse({ body: req.body }).body;

    let clientId: number | null = null;

    if (resetToken) {
      // OTP flow: verify from Redis
      const cached = await getCache<{ clientId: number }>(`reset_token:${resetToken}`);
      if (!cached) {
        return res.status(400).json({ error: 'Invalid or expired reset token. Please start over.' });
      }
      clientId = cached.clientId;
      await deleteCache(`reset_token:${resetToken}`);
    } else if (token) {
      // Legacy DB token flow
      const resetTokenData = await authClientModel.findResetToken(token);
      if (!resetTokenData || resetTokenData.used || new Date(resetTokenData.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new password reset.' });
      }
      clientId = resetTokenData.clientId;
      await authClientModel.markResetTokenAsUsed(resetTokenData.id);
    } else {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    const hashedPassword = await hashPassword(password);
    const passwordUpdated = await authClientModel.updatePassword(clientId, hashedPassword);
    if (!passwordUpdated) {
      return res.status(500).json({ error: 'Failed to update password. Please try again later.' });
    }

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({ field: err.path.join('.'), message: err.message })),
      });
    }
    log.error('Error in resetPassword', error instanceof Error ? error : null);
    next(error);
  }
};


