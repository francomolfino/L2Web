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
  res.render("register", { error: null });
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

      return res.render("register", { error: "Completá todos los campos." });
    }

    if (!isValidLogin(login)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid login format"
      });

      return res.render("register", {
        error: "El usuario debe tener entre 3 y 16 caracteres y solo usar letras, números o guion bajo."
      });
    }

    if (!isValidEmail(email)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid email format"
      });

      return res.render("register", { error: "El email no es válido." });
    }

    if (!isValidPassword(password)) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Invalid password format"
      });

      return res.render("register", {
        error: "La contraseña debe tener entre 6 y 32 caracteres."
      });
    }

    if (password !== confirmPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      return res.render("register", { error: "Las contraseñas no coinciden." });
    }

    const existing = await findAccountByLogin(login);
    if (existing) {
      await writeAuditLog({
        accountName: login,
        actionName: "REGISTER_FAILED",
        ipAddress,
        details: "Account already exists"
      });

      return res.render("register", { error: "La cuenta ya existe." });
    }

    await createAccount(login, password, email);

    await writeAuditLog({
      accountName: login,
      actionName: "REGISTER_SUCCESS",
      ipAddress,
      details: "Account created"
    });

    req.session.regenerate((err) => {
      if (err) {
        return res.redirect("/login");
      }

      req.session.user = { login };
      return res.redirect("/account");
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "REGISTER_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("register", { error: "No se pudo crear la cuenta." });
  }
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
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

      return res.render("login", { error: "Completá usuario y contraseña." });
    }


    const user = await loginWithGameAccount(login, password);

    if (!user) {
      await writeAuditLog({
        accountName: login,
        actionName: "LOGIN_FAILED",
        ipAddress,
        details: "Invalid credentials"
      });

      return res.render("login", { error: "Credenciales inválidas." });
    }

    await writeAuditLog({
      accountName: login,
      actionName: "LOGIN_SUCCESS",
      ipAddress,
      details: "Successful login"
    });

    req.session.regenerate((err) => {
      if (err) {
        return res.render("login", { error: "No se pudo iniciar sesión." });
      }

      req.session.user = user;
      return res.redirect("/account");
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "LOGIN_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("login", { error: "No se pudo iniciar sesión." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("l2web.sid");
    return res.redirect("/");
  });
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { message: null });
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

      return res.render("forgot-password", { message: genericMessage });
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

    return res.render("forgot-password", { message: genericMessage });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: normalizeLogin(req.body.login),
      actionName: "PASSWORD_RESET_REQUEST",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("forgot-password", {
      message: "No se pudo procesar la solicitud."
    });
  }
});

router.get("/reset-password", async (req, res) => {
  try {
    const token = String(req.query.token || "");

    if (!token) {
      return res.render("reset-password", {
        error: "Token inválido.",
        token: "",
        isValidToken: false
      });
    }

    const valid = await isRecoveryTokenValid(token);

    if (!valid) {
      return res.render("reset-password", {
        error: "Este enlace ya fue usado o venció.",
        token: "",
        isValidToken: false
      });
    }

    return res.render("reset-password", {
      error: null,
      token,
      isValidToken: true
    });
  } catch (error) {
    console.error(error);

    return res.render("reset-password", {
      error: "No se pudo validar el enlace.",
      token: "",
      isValidToken: false
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

      return res.render("reset-password", { error: "Token inválido.", token: "" });
    }

    if (!isValidPassword(password)) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Invalid password format"
      });

      return res.render("reset-password", {
        error: "La contraseña debe tener entre 6 y 32 caracteres.",
        token
      });
    }

    if (password !== confirmPassword) {
      await writeAuditLog({
        actionName: "PASSWORD_RESET_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      return res.render("reset-password", {
        error: "Las contraseñas no coinciden.",
        token
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
        error: "Token inválido o vencido.",
        token: ""
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

    return res.redirect("/login");
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      actionName: "PASSWORD_RESET_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("reset-password", {
      error: "No se pudo resetear la contraseña.",
      token: ""
    });
  }
});

export default router;