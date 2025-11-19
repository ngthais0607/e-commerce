import { UserService } from '../services/userService.js';
import { z } from 'zod';

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['CUSTOMER', 'ADMIN', 'STAFF']),
    isActive: z.boolean().optional(),
  }),
});

export const getUsers = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '10', 10), 50),
      role: req.query.role,
      search: req.query.search?.trim(),
    };

    const result = await UserService.getAllUsers(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const data = updateUserSchema.parse({ body: req.body }).body;
    const user = await UserService.updateUser(req.user.id, data);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateUserRoleSchema.parse({ body: req.body }).body;

    const user = await UserService.updateUserRole(id, data.role, data.isActive);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

