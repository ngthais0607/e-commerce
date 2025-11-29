import { z } from 'zod';
import { authUserModel } from '../../models/user/auth.model.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { authView } from '../../views/user/auth.view.js';

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

export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = registerSchema.parse({ body: req.body }).body;

    const existingUser = await authUserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await authUserModel.createUser({
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'CUSTOMER',
    });

    const token = generateToken(user.id);
    res.status(201).json(authView.authResponse({ user, token }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse({ body: req.body }).body;

    const user = await authUserModel.findByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json(
      authView.authResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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

export const getMe = async (req, res, next) => {
  try {
    const user = await authUserModel.findById(req.user.id);
    res.json(authView.profile(user));
  } catch (error) {
    next(error);
  }
};


