export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.login) {
    return res.redirect("/login");
  }
  next();
}