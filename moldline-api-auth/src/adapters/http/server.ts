import express from 'express';
import cors from 'cors';
import type { UserRepo } from '../../ports/user-repo';
import { makeRegister, makeLogin, makeGetMe, makeRefresh, makeListUsers } from '../../application/use-cases';
import { mountAuthRoutes } from './routes/auth-routes';
import { authRateLimiter } from './middleware/rate-limit-auth';
import { errorHandler } from './middleware/error-handler';

const corsOrigin = process.env.CORS_ORIGIN ?? '*';

export function createServer(userRepo: UserRepo): express.Express {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: corsOrigin }));

  const register = makeRegister(userRepo);
  const login = makeLogin(userRepo);
  const getMe = makeGetMe(userRepo);
  const refresh = makeRefresh(userRepo);
  const listUsers = makeListUsers(userRepo);

  const handlers = { register, login, getMe, refresh, listUsers };
  const router = express.Router();
  mountAuthRoutes(router, handlers, authRateLimiter);
  app.use(router);

  app.use(errorHandler);
  return app;
}
