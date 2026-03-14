import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import crypto from 'crypto';
import { authClientModel } from '../../models/client/auth.model.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { authView } from '../../views/client/auth.view.js';
import { sendPasswordReset } from '../../services/emailService.js';
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
 * Request password reset - sends reset token via email
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Client email address
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = requestPasswordResetSchema.parse({ body: req.body }).body;

    const client = await authClientModel.findByEmail(email);
    if (!client) {
      // Don't reveal if email exists for security
      return res.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    try {
      await authClientModel.createResetToken(client.id, resetToken, resetTokenExpiry);
    } catch (dbError) {
      log.error('Failed to create reset token', dbError instanceof Error ? dbError : null, {
        clientId: client.id,
      });
      return res.status(500).json({
        error: 'Failed to process password reset request. Please try again later.',
      });
    }

    // Send password reset email
    try {
      await sendPasswordReset(client, resetToken);
    } catch (emailError) {
      log.error('Failed to send password reset email', emailError instanceof Error ? emailError : null, {
        clientId: client.id,
      });
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    log.error('Error in requestPasswordReset', error instanceof Error ? error : null);
    next(error);
  }
};

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: z.string().min(6),
  }),
});

/**
 * Reset password using reset token
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.token - Password reset token
 * @param {string} req.body.password - New password (min 6 characters)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = resetPasswordSchema.parse({ body: req.body }).body;

    // Verify token from database
    const resetTokenData = await authClientModel.findResetToken(token);
    if (!resetTokenData) {
      return res.status(400).json({
        error: 'Invalid or expired reset token. Please request a new password reset.',
      });
    }

    // Check if token is already used
    if (resetTokenData.used) {
      return res.status(400).json({
        error: 'This reset token has already been used. Please request a new password reset.',
      });
    }

    // Check if token is expired (additional check, though database query already filters)
    if (new Date(resetTokenData.expiresAt) < new Date()) {
      return res.status(400).json({
        error: 'Reset token has expired. Please request a new password reset.',
      });
    }

    // Hash new password
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashError) {
      log.error('Failed to hash password', hashError instanceof Error ? hashError : null);
      return res.status(500).json({
        error: 'Failed to process password reset. Please try again later.',
      });
    }

    // Update password
    const passwordUpdated = await authClientModel.updatePassword(
      resetTokenData.clientId,
      hashedPassword
    );
    if (!passwordUpdated) {
      log.error('Failed to update password', null, {
        clientId: resetTokenData.clientId,
      });
      return res.status(500).json({
        error: 'Failed to update password. Please try again later.',
      });
    }

    // Mark token as used
    await authClientModel.markResetTokenAsUsed(resetTokenData.id);

    res.json({
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    log.error('Error in resetPassword', error instanceof Error ? error : null);
    next(error);
  }
};


