import { Router } from "express";
import { createAccount, findAccountByLogin, updateAccountPassword } from "../services/accountService.js";
import { loginWithGameAccount } from "../services/authService.js";
import {
  createRecoveryToken,
  consumeRecoveryToken,
  invalidateRecoveryTokens,
  isRecoveryTokenValid
} from "../services/recoveryService.js";
import { sendPasswordResetEmail } from "../services/mailService.js";
import { config } from "../config.js";
import {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  registerRateLimiter
} from "../middleware/rateLimiters.js";
import {
  normalizeLogin,
  normalizeEmail,
  isValidLogin,
  isValidEmail,
  isValidPassword
} from "../services/validators.js";
import { writeAuditLog } from "../services/auditService.js";
import { getClientIp } from "../services/requestService.js";

const router = Router();

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", registerRateLimiter, async (req, res) => {
  try {
    const login = normalizeLogin(req.body.login);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const ipAddress = getClientIp(req);

    if (!login || !email || !password || !confirmPassword) {
      await writeAuditLog({
        accountName: login || null,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Missing required fields"
      });

      req.session.error = "Completá todos los campos.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    if (!isValidLogin(login)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid login format"
      });

      req.session.error = "El usuario debe tener entre 3 y 16 caracteres y solo usar letras, números o guion bajo.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    if (!isValidEmail(email)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid email format"
      });

      req.session.error = "El email no es válido.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    if (!isValidPassword(password)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid password format"
      });

      req.session.error = "La contraseña debe tener entre 6 y 32 caracteres.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    if (password !== confirmPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      req.session.error = "Las contraseñas no coinciden.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    const existing = await findAccountByLogin(login);
    if (existing) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Account already exists"
      });

      req.session.error = "La cuenta ya existe.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/register");
      });
    }

    await createAccount(login, password, email);

    await writeAuditLog({
      accountName: login,
      actionName: "REGISTER_SUCCESS",
      ipAddress,
      details: "Account created"
    });

    return req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.redirect("/login");
      }

      req.session.user = { login };
      req.session.message = "Cuenta creada correctamente";

      return req.session.save((saveErr) => {
        if (saveErr) console.error(saveErr);
          return res.redirect("/");
      });
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "REGISTER_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    req.session.error = "No se pudo crear la cuenta.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/register");
    });
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const login = normalizeLogin(req.body.login);
    const password = String(req.body.password || "");
    const ipAddress = getClientIp(req);

    if (!login || !password) {
      await writeAuditLog({
        accountName: login || null,
        actionName: "LOGIN_FAILED",
        ipAddress,
        details: "Missing credentials"
      });

      req.session.error = "Completá usuario y contraseña.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/login");
      });
    }

    const user = await loginWithGameAccount(login, password);

    if (!user) {
      await writeAuditLog({
        accountName: login,
        actionName: "LOGIN_FAILED",
        ipAddress,
        details: "Invalid credentials"
      });

      req.session.error = "Credenciales inválidas.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/login");
      });
    }

    await writeAuditLog({
      accountName: login,
      actionName: "LOGIN_SUCCESS",
      ipAddress,
      details: "Successful login"
    });

    return req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        req.session.error = "No se pudo iniciar sesión.";

        return req.session.save((saveErr) => {
          if (saveErr) console.error(saveErr);
          return res.redirect("/login");
        });
      }

      req.session.user = user;
      req.session.message = "Sesión iniciada correctamente.";

      return req.session.save((saveErr) => {
        if (saveErr) console.error(saveErr);
        return res.redirect("/");
      });
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "LOGIN_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    req.session.error = "No se pudo iniciar sesión.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/login");
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("l2web.sid");
    return res.redirect("/");
  });
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

router.post("/forgot-password", forgotPasswordRateLimiter, async (req, res) => {
  try {
    const login = normalizeLogin(req.body.login);
    const ipAddress = getClientIp(req);
    const genericMessage = "Si la cuenta existe, se envió un correo con instrucciones.";

    if (!login || !isValidLogin(login)) {
      await writeAuditLog({
        accountName: login || null,
        actionName: "PASSWORD_RESET_REQUEST",
        ipAddress,
        details: "Invalid or empty login"
      });

      req.session.message = genericMessage;
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/forgot-password");
      });
    }

    const account = await findAccountByLogin(login);

    if (account && account.email) {
      const token = await createRecoveryToken(login);
      const resetUrl = `${config.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail({
        to: account.email,
        login: account.login,
        resetUrl
      });

      await writeAuditLog({
        accountName: login,
        actionName: "PASSWORD_RESET_REQUEST",
        ipAddress,
        details: "Recovery email sent"
      });
    } else {
      await writeAuditLog({
        accountName: login,
        actionName: "PASSWORD_RESET_REQUEST",
        ipAddress,
        details: "Account missing or without email"
      });
    }

    req.session.message = genericMessage;
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/forgot-password");
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "PASSWORD_RESET_REQUEST",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    req.session.error = "No se pudo procesar la solicitud.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/forgot-password");
    });
  }
});

router.get("/reset-password", async (req, res) => {
  try {
    const token = String(req.query.token || "");

    if (!token) {
      return res.render("reset-password", {
        token: "",
        isValidToken: false,
        error: "Token inválido."
      });
    }

    const valid = await isRecoveryTokenValid(token);

    if (!valid) {
      return res.render("reset-password", {
        token: "",
        isValidToken: false,
        error: "Este enlace ya fue usado o venció."
      });
    }

    return res.render("reset-password", {
      token,
      isValidToken: true,
      error: null
    });
  } catch (error) {
    console.error(error);

    return res.render("reset-password", {
      token: "",
      isValidToken: false,
      error: "No se pudo validar el enlace."
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const ipAddress = getClientIp(req);

    if (!token) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Missing token"
      });

      return res.render("reset-password", {
        token: "",
        isValidToken: false,
        error: "Token inválido."
      });
    }

    if (!isValidPassword(password)) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Invalid password format"
      });

      return res.render("reset-password", {
        token,
        isValidToken: true,
        error: "La contraseña debe tener entre 6 y 32 caracteres."
      });
    }

    if (password !== confirmPassword) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      return res.render("reset-password", {
        token,
        isValidToken: true,
        error: "Las contraseñas no coinciden."
      });
    }

    const accountName = await consumeRecoveryToken(token);

    if (!accountName) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Invalid or expired token"
      });

      return res.render("reset-password", {
        token: "",
        isValidToken: false,
        error: "Token inválido o vencido."
      });
    }

    await updateAccountPassword(accountName, password);
    await invalidateRecoveryTokens(accountName);

    await writeAuditLog({
      accountName,
      actionName: "PASSWORD_RESET_SUCCESS",
      ipAddress,
      details: "Password reset completed"
    });

    req.session.message = "Contraseña restablecida correctamente.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/login");
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      actionName: "PASSWORD_RESET_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("reset-password", {
      token: "",
      isValidToken: false,
      error: "No se pudo resetear la contraseña."
    });
  }
});

export default router;