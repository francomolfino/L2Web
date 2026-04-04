import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getCharactersByAccount } from "../services/characterService.js";
import { updateAccountPassword } from "../services/accountService.js";
import { loginWithGameAccount } from "../services/authService.js";
import { getServerStatus } from "../services/serverStatusService.js";

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
  const login = req.session.user.login;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.render("change-password", { error: "Las contraseñas no coinciden." });
  }

  const valid = await loginWithGameAccount(login, currentPassword);

  if (!valid) {
    return res.render("change-password", { error: "La contraseña actual es incorrecta." });
  }

  await updateAccountPassword(login, newPassword);
  return res.redirect("/account");
});

export default router;