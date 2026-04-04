export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
}