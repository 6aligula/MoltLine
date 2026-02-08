import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../application/errors';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.code, message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const first = err.errors[0];
    const message = first ? `${first.path.join('.')}: ${first.message}` : 'Validation error';
    res.status(400).json({ error: 'VALIDATION_ERROR', message });
    return;
  }
  // No loguear tokens ni passwords
  const safeMessage = err instanceof Error ? err.message : 'Internal server error';
  if (!safeMessage.toLowerCase().includes('token') && !safeMessage.toLowerCase().includes('password')) {
    console.error(err);
  }
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
