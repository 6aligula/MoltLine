import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX ?? '5', 10);

export const authRateLimiter = rateLimit({
  windowMs,
  max,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
