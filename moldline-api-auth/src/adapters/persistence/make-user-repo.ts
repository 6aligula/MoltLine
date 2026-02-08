import type { UserRepo } from '../../ports/user-repo';
import { FirestoreUserRepo } from './firestore-user-repo';
import { PostgresUserRepo } from './postgres-user-repo';

export function makeUserRepo(): UserRepo {
  const driver = (process.env.AUTH_DB_DRIVER ?? 'firebase').toLowerCase();
  if (driver === 'postgres') {
    return new PostgresUserRepo();
  }
  return new FirestoreUserRepo();
}
