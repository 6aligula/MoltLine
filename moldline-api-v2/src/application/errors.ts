export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string) => new AppError(msg, 400);
export const unauthorized = (msg: string) => new AppError(msg, 401);
export const notFound = (msg: string) => new AppError(msg, 404);
