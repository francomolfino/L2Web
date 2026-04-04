export function normalizeLogin(value) {
  return String(value || "").trim();
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidLogin(login) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(login);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 6) return false;
  if (password.length > 32) return false;
  return true;
}