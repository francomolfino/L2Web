import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Demasiados intentos de inicio de sesión. Probá de nuevo más tarde."
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Demasiadas solicitudes de recuperación. Probá de nuevo más tarde."
});