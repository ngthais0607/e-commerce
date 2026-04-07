import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { authClientModel } from '../models/client/auth.model.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await authClientModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account disabled' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

