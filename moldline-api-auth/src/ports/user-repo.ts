import type { User } from '../domain/entities';

export interface CreateUserInput {
  name: string;
  passwordHash: string;
  email?: string;
  phone?: string;
}

export interface UserRepo {
  createUser(data: CreateUserInput): Promise<User>;
  findByName(name: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  listUsers(limit: number): Promise<User[]>;
}
