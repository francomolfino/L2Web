export function requireAuth(req, res, next) {
  if (!req.session?.user?.login) {
    return res.redirect("/login");
  }
  next();
}