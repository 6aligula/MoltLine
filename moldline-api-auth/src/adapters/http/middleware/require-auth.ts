import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../application/auth-service';
import { AppError } from '../../../application/errors';

export interface AuthLocals {
  userId: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthLocals;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, name: payload.name };
    next();
  } catch (e) {
    if (e instanceof AppError) {
      res.status(e.statusCode).json({ error: e.code, message: e.message });
      return;
    }
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}
