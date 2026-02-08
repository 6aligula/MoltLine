import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { User } from '../domain/entities';
import { AppError } from './errors';

const BCRYPT_ROUNDS = Math.max(10, parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10));
const JWT_EXPIRATION = process.env.JWT_EXPIRATION ?? '24h';

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export interface JwtPayload {
  sub: string;
  name: string;
  iat: number;
  exp: number;
}

export function signToken(user: User): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: user.userId, name: user.name };
  // expiresIn acepta ej. "24h" (ms/zeit); tipos de @types/jsonwebtoken usan StringValue
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRATION } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch {
    throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
  }
}
