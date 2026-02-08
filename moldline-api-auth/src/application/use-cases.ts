import type { UserRepo } from '../ports/user-repo';
import type { UserProfile } from '../domain/entities';
import { AuthErrors, AppError } from './errors';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth-service';
import type { RegisterBody, LoginBody } from './validation';

const DEFAULT_LIST_USERS_LIMIT = 100;

function toProfile(user: { userId: string; name: string; email?: string; phone?: string; createdAt: Date }): UserProfile {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export interface RegisterResult {
  userId: string;
  name: string;
  token: string;
}

export interface LoginResult {
  userId: string;
  name: string;
  token: string;
}

export interface RefreshResult {
  token: string;
}

export function makeRegister(userRepo: UserRepo) {
  return async function register(body: RegisterBody): Promise<RegisterResult> {
    const existing = await userRepo.findByName(body.name);
    if (existing) {
      throw new AppError(
        AuthErrors.USERNAME_TAKEN.code,
        AuthErrors.USERNAME_TAKEN.status,
        AuthErrors.USERNAME_TAKEN.message
      );
    }
    const passwordHash = hashPassword(body.password);
    try {
      const user = await userRepo.createUser({
        name: body.name.trim(),
        passwordHash,
        email: body.email,
        phone: body.phone,
      });
      const token = signToken(user);
      return { userId: user.userId, name: user.name, token };
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'USERNAME_TAKEN') {
        throw new AppError(
          AuthErrors.USERNAME_TAKEN.code,
          AuthErrors.USERNAME_TAKEN.status,
          AuthErrors.USERNAME_TAKEN.message
        );
      }
      throw e;
    }
  };
}

export function makeLogin(userRepo: UserRepo) {
  return async function login(body: LoginBody): Promise<LoginResult> {
    const user = await userRepo.findByName(body.name);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      throw new AppError(
        AuthErrors.INVALID_CREDENTIALS.code,
        AuthErrors.INVALID_CREDENTIALS.status,
        AuthErrors.INVALID_CREDENTIALS.message
      );
    }
    const token = signToken(user);
    return { userId: user.userId, name: user.name, token };
  };
}

export function makeGetMe(userRepo: UserRepo) {
  return async function getMe(userId: string): Promise<UserProfile> {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError(AuthErrors.UNAUTHORIZED.code, AuthErrors.UNAUTHORIZED.status, AuthErrors.UNAUTHORIZED.message);
    }
    return toProfile(user);
  };
}

export function makeRefresh(userRepo: UserRepo) {
  return async function refresh(userId: string): Promise<RefreshResult> {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError(AuthErrors.UNAUTHORIZED.code, AuthErrors.UNAUTHORIZED.status, AuthErrors.UNAUTHORIZED.message);
    }
    const token = signToken(user);
    return { token };
  };
}

export function makeListUsers(userRepo: UserRepo) {
  return async function listUsers(limit: number = DEFAULT_LIST_USERS_LIMIT): Promise<Array<{ userId: string; name: string }>> {
    const users = await userRepo.listUsers(limit);
    return users.map((u) => ({ userId: u.userId, name: u.name }));
  };
}
