import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getCharactersByAccount } from "../services/characterService.js";
import { updateAccountPassword, findAccountByLogin } from "../services/accountService.js";
import { loginWithGameAccount } from "../services/authService.js";
import { getServerStatus } from "../services/serverStatusService.js";
import { isValidPassword } from "../services/validators.js";
import { writeAuditLog } from "../services/auditService.js";
import { getClientIp } from "../services/requestService.js";
import { invalidateRecoveryTokens } from "../services/recoveryService.js";

const router = Router();

router.get("/account", requireAuth, async (req, res) => {
  const login = req.session.user.login;
  const account = await findAccountByLogin(login);
  const characters = await getCharactersByAccount(login);
  const status = await getServerStatus();

  res.render("account", {
    login,
    account,
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
    const ipAddress = getClientIp(req);

    if (!currentPassword || !newPassword || !confirmPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Missing required fields"
      });

      return res.render("change-password", { error: "Completá todos los campos." });
    }

    if (!isValidPassword(newPassword)) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Invalid new password format"
      });

      return res.render("change-password", {
        error: "La nueva contraseña debe tener entre 6 y 32 caracteres."
      });
    }

    if (newPassword !== confirmPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      return res.render("change-password", { error: "Las contraseñas no coinciden." });
    }

    if (currentPassword === newPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "New password equals current password"
      });

      return res.render("change-password", {
        error: "La nueva contraseña no puede ser igual a la actual."
      });
    }

    const valid = await loginWithGameAccount(login, currentPassword);

    if (!valid) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Current password is incorrect"
      });

      return res.render("change-password", { error: "La contraseña actual es incorrecta." });
    }

    await updateAccountPassword(login, newPassword);

    await invalidateRecoveryTokens(login);

    await writeAuditLog({
      accountName: login,
      actionName: "CHANGE_PASSWORD_SUCCESS",
      ipAddress,
      details: "Password changed"
    });

    req.session.destroy(() => {
      res.clearCookie("l2web.sid");
      return res.redirect("/login");
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: req.session?.user?.login || null,
      actionName: "CHANGE_PASSWORD_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    return res.render("change-password", {
      error: "No se pudo cambiar la contraseña."
    });
  }
});

export default router;