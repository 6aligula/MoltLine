import type { User } from '../../domain/entities';
import type { CreateUserInput, UserRepo } from '../../ports/user-repo';

/**
 * Stub / implementación opcional para Postgres.
 * Misma interfaz que FirestoreUserRepo; activar con AUTH_DB_DRIVER=postgres
 * y DATABASE_URL configurada.
 */
export class PostgresUserRepo implements UserRepo {
  async createUser(_data: CreateUserInput): Promise<User> {
    throw new Error('PostgresUserRepo not implemented. Set AUTH_DB_DRIVER=firebase or implement this repo.');
  }

  async findByName(_name: string): Promise<User | null> {
    throw new Error('PostgresUserRepo not implemented.');
  }

  async findById(_userId: string): Promise<User | null> {
    throw new Error('PostgresUserRepo not implemented.');
  }

  async listUsers(_limit: number): Promise<User[]> {
    throw new Error('PostgresUserRepo not implemented.');
  }
}
