import type { Request, Response } from 'express';
import type { RegisterResult, LoginResult, RefreshResult } from '../../../application/use-cases';
import type { UserProfile } from '../../../domain/entities';
import { registerBodySchema, loginBodySchema } from '../../../application/validation';
import { AppError } from '../../../application/errors';
import { requireAuth } from '../middleware/require-auth';
import { asyncHandler } from '../async-handler';

export interface AuthHandlers {
  register: (body: { name: string; password: string; email?: string; phone?: string }) => Promise<RegisterResult>;
  login: (body: { name: string; password: string }) => Promise<LoginResult>;
  getMe: (userId: string) => Promise<UserProfile>;
  refresh: (userId: string) => Promise<RefreshResult>;
  listUsers: (limit?: number) => Promise<Array<{ userId: string; name: string }>>;
}

export function createAuthRoutes(handlers: AuthHandlers) {
  return {
    postRegister: asyncHandler(async (req: Request, res: Response) => {
      const parsed = registerBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        const message = first ? first.message : 'Validation error';
        throw new AppError('VALIDATION_ERROR', 400, message);
      }
      const result = await handlers.register(parsed.data);
      res.status(201).json(result);
    }),

    postLogin: asyncHandler(async (req: Request, res: Response) => {
      const parsed = loginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        const message = first ? first.message : 'Validation error';
        throw new AppError('VALIDATION_ERROR', 400, message);
      }
      const result = await handlers.login(parsed.data);
      res.json(result);
    }),

    getMe: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.auth?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
      const profile = await handlers.getMe(userId);
      res.json({
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        createdAt: profile.createdAt.toISOString(),
      });
    }),

    postRefresh: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.auth?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
      const result = await handlers.refresh(userId);
      res.json(result);
    }),

    getUsers: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.auth?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
      const list = await handlers.listUsers(Number.isFinite(limit) ? limit! : undefined);
      res.json(list);
    }),

    getHealth(_req: Request, res: Response): void {
      res.json({ status: 'ok', service: 'auth' });
    },
  };
}

export function mountAuthRoutes(router: import('express').Router, handlers: AuthHandlers, authRateLimiter: import('express').RequestHandler): void {
  const routes = createAuthRoutes(handlers);
  router.post('/register', authRateLimiter, routes.postRegister);
  router.post('/login', authRateLimiter, routes.postLogin);
  router.get('/health', routes.getHealth);

  router.get('/me', requireAuth, routes.getMe);
  router.post('/refresh', requireAuth, routes.postRefresh);
  router.get('/users', requireAuth, routes.getUsers);
}
