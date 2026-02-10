import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  sub: string;
  name: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userName?: string;
    }
  }
}

/**
 * Auth: solo JWT Bearer.
 * Si hay Authorization: Bearer <token>, valida con JWT_SECRET y pone req.userId (sub) y req.userName (name).
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (token && JWT_SECRET && JWT_SECRET.length >= 32) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.sub;
      req.userName = decoded.name;
      next();
      return;
    } catch {
      // Token inválido o expirado; no ponemos userId (siguiente ruta protegida devolverá 401)
    }
  }
  next();
}
