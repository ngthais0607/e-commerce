import { verifyToken } from '../utils/jwt.js';
import { authClientModel } from '../models/client/auth.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await authClientModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: true,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

