import { makeUserRepo } from '../adapters/persistence/make-user-repo';
import type { UserRepo } from '../ports/user-repo';

export interface AuthContainer {
  userRepo: UserRepo;
}

export function createContainer(): AuthContainer {
  const userRepo = makeUserRepo();
  return { userRepo };
}
