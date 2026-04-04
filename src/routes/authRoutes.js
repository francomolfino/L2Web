import { Router } from "express";
import { createAccount, findAccountByLogin, updateAccountPassword } from "../services/accountService.js";
import { loginWithGameAccount } from "../services/authService.js";
import { createRecoveryToken, consumeRecoveryToken } from "../services/recoveryService.js";
import { sendPasswordResetEmail } from "../services/mailService.js";
import { config } from "../config.js";

const router = Router();

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  try {
    const { login, email, password, confirmPassword } = req.body;

    if (!login || !email || !password) {
      return res.render("register", { error: "Completá usuario, email y contraseña." });
    }

    if (password !== confirmPassword) {
      return res.render("register", { error: "Las contraseñas no coinciden." });
    }

    const existing = await findAccountByLogin(login);
    if (existing) {
      return res.render("register", { error: "La cuenta ya existe." });
    }

    await createAccount(login, password, email);
    return res.redirect("/login");
  } catch (error) {
    return res.render("register", { error: "No se pudo crear la cuenta." });
  }
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { login, password } = req.body;
  const user = await loginWithGameAccount(login, password);

  if (!user) {
    return res.render("login", { error: "Credenciales inválidas." });
  }

  req.session.user = user;
  return res.redirect("/account");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { message: null });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { login } = req.body;

    // 🔴 mensaje neutro SIEMPRE
    const genericMessage =
      "Si la cuenta existe, se envió un correo con instrucciones.";

    if (!login) {
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
    }

    return res.render("forgot-password", { message: genericMessage });
  } catch (error) {
    console.error(error);

    return res.render("forgot-password", {
      message: "No se pudo procesar la solicitud."
    });
  }
});
  

router.get("/reset-password", (req, res) => {
  res.render("reset-password", { error: null, token: req.query.token || "" });
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.render("reset-password", { error: "Token inválido.", token: "" });
    }

    if (!password || password !== confirmPassword) {
      return res.render("reset-password", {
        error: "Las contraseñas no coinciden.",
        token
      });
    }

    const accountName = await consumeRecoveryToken(token);

    if (!accountName) {
      return res.render("reset-password", {
        error: "Token inválido o vencido.",
        token: ""
      });
    }

    await updateAccountPassword(accountName, password);

    return res.redirect("/login");
  } catch (error) {
    return res.render("reset-password", {
      error: "No se pudo resetear la contraseña.",
      token: ""
    });
  }
});

export default router;