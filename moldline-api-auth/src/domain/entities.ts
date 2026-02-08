import type { UserId } from './types';

export interface User {
  userId: UserId;
  name: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

/** Usuario sin datos sensibles, para respuestas públicas (listado, /me) */
export interface UserProfile {
  userId: UserId;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}
