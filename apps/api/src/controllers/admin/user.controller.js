import { z } from 'zod';
import { adminUserModel } from '../../models/admin/user.model.js';
import { adminUserView } from '../../views/admin/user.view.js';

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

    const result = await adminUserModel.list(filters);
    res.json(adminUserView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await adminUserModel.getById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(adminUserView.detail(user));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateUserRoleSchema.parse({ body: req.body }).body;
    const user = await adminUserModel.updateRole(id, data.role, data.isActive);
    res.json(adminUserView.detail(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};


