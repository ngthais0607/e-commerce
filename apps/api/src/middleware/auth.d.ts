import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
}

export declare function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void>;

export declare function authorize(
  ...roles: string[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;

