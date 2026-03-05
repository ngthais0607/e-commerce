import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { userProfileModel } from '../../models/client/user.model.js';
import { userProfileView } from '../../views/client/user.view.js';

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
  }),
});

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse({ body: req.body }).body;
    const user = await userProfileModel.update(req.user!.id, data);
    res.json(userProfileView.profile(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};


