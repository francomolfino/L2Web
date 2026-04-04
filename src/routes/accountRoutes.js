import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getCharactersByAccount } from "../services/characterService.js";
import { updateAccountPassword } from "../services/accountService.js";
import { loginWithGameAccount } from "../services/authService.js";
import { getServerStatus } from "../services/serverStatusService.js";
import { isValidPassword } from "../services/validators.js";

const router = Router();

router.get("/account", requireAuth, async (req, res) => {
  const login = req.session.user.login;
  const characters = await getCharactersByAccount(login);
  const status = await getServerStatus();

  res.render("account", {
    login,
    characters: characters || [],
    status,
    message: null,
    error: null
  });
});

router.get("/change-password", requireAuth, (req, res) => {
  res.render("change-password", { error: null });
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const login = req.session.user.login;
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render("change-password", { error: "Completá todos los campos." });
    }

    if (!isValidPassword(newPassword)) {
      return res.render("change-password", {
        error: "La nueva contraseña debe tener entre 6 y 32 caracteres."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("change-password", { error: "Las contraseñas no coinciden." });
    }

    if (currentPassword === newPassword) {
      return res.render("change-password", {
        error: "La nueva contraseña no puede ser igual a la actual."
      });
    }

    const valid = await loginWithGameAccount(login, currentPassword);

    if (!valid) {
      return res.render("change-password", { error: "La contraseña actual es incorrecta." });
    }

    await updateAccountPassword(login, newPassword);
    return res.redirect("/account");
  } catch (error) {
    console.error(error);
    return res.render("change-password", {
      error: "No se pudo cambiar la contraseña."
    });
  }
});

export default router;