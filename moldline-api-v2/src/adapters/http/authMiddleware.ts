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
 * Auth: JWT (Bearer) como fuente de verdad; fallback x-user-id para compatibilidad.
 * Si hay Authorization: Bearer <token>, valida con JWT_SECRET y pone req.userId (sub) y req.userName (name).
 * Si no, usa x-user-id como req.userId (sin userName).
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const legacyUserId = req.header('x-user-id');

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

  if (legacyUserId) {
    req.userId = legacyUserId;
    req.userName = undefined;
  }
  next();
}
