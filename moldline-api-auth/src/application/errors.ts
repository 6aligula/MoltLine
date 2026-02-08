/** Errores de negocio con código para respuestas API según spec */
export const AuthErrors = {
  USERNAME_TAKEN: { code: 'USERNAME_TAKEN' as const, status: 409, message: 'This nickname is already in use' },
  VALIDATION_ERROR: (msg: string) => ({ code: 'VALIDATION_ERROR' as const, status: 400, message: msg }),
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS' as const, status: 401, message: 'Invalid nickname or password' },
  UNAUTHORIZED: { code: 'UNAUTHORIZED' as const, status: 401, message: 'Invalid or expired token' },
} as const;

export type AuthErrorCode = typeof AuthErrors[keyof typeof AuthErrors] extends { code: infer C } ? C : never;

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
