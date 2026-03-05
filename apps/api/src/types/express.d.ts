import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
      };
    }
  }
}

export {};
