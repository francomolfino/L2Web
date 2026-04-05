import crypto from "crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfTokenMiddleware(req, res, next) {
  if (!req.session) {
    return next(new Error("Session middleware is required before CSRF middleware."));
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const tokenFromBody = req.body?._csrf;
  const tokenFromHeader =
    req.get("x-csrf-token") ||
    req.get("csrf-token") ||
    req.get("xsrf-token") ||
    req.get("x-xsrf-token");

  const submittedToken = tokenFromBody || tokenFromHeader;
  const sessionToken = req.session?.csrfToken;

  if (!sessionToken || !submittedToken || submittedToken !== sessionToken) {
    return res.status(403).render("error", {
      title: "403",
      message: "Solicitud inválida."
    });
  }

  return next();
}