/* eslint-disable @typescript-eslint/no-unused-vars -- Request used for module augmentation */
import type { Request } from 'express';
/* eslint-enable @typescript-eslint/no-unused-vars */

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
