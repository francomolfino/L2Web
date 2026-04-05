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
import { formatDate, formatDateTime } from "../utils/dateUtils.js";

const router = Router();

router.get("/account", requireAuth, async (req, res) => {
  try {
    const login = req.session.user.login;
    const accountRaw = await findAccountByLogin(login);
    const account = accountRaw
      ? {
          ...accountRaw,
          formattedCreatedTime: formatDate(accountRaw.created_time)
        }
      : null;
    const charactersRaw = await getCharactersByAccount(login);
    const characters = (charactersRaw || []).map((char) => ({
      ...char,
      formattedCreateDate: formatDateTime(char.createDate)
    }));
    const status = await getServerStatus();

    return res.render("account", {
      login,
      account,
      characters: characters || [],
      status
    });
  } catch (error) {
    console.error(error);
    req.session.error = "No se pudo cargar la cuenta.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/");
    });
  }
});

router.get("/change-password", requireAuth, (req, res) => {
  return res.render("change-password");
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

      req.session.error = "Completá todos los campos.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/change-password");
      });
    }

    if (!isValidPassword(newPassword)) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Invalid new password format"
      });

      req.session.error = "La nueva contraseña debe tener entre 6 y 32 caracteres.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/change-password");
      });
    }

    if (newPassword !== confirmPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "Password confirmation mismatch"
      });

      req.session.error = "Las contraseñas no coinciden.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/change-password");
      });
    }

    if (currentPassword === newPassword) {
      await writeAuditLog({
        accountName: login,
        actionName: "CHANGE_PASSWORD_FAILED",
        ipAddress,
        details: "New password equals current password"
      });

      req.session.error = "La nueva contraseña no puede ser igual a la actual.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/change-password");
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

      req.session.error = "La contraseña actual es incorrecta.";
      return req.session.save((err) => {
        if (err) console.error(err);
        return res.redirect("/change-password");
      });
    }

    await updateAccountPassword(login, newPassword);
    await invalidateRecoveryTokens(login);

    await writeAuditLog({
      accountName: login,
      actionName: "CHANGE_PASSWORD_SUCCESS",
      ipAddress,
      details: "Password changed"
    });

    return req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.redirect("/login");
      }

      req.session.message = "Contraseña actualizada correctamente.";
      return req.session.save((saveErr) => {
        if (saveErr) console.error(saveErr);
        return res.redirect("/login");
      });
    });
  } catch (error) {
    console.error(error);

    await writeAuditLog({
      accountName: req.session?.user?.login || null,
      actionName: "CHANGE_PASSWORD_FAILED",
      ipAddress: getClientIp(req),
      details: "Unhandled exception"
    });

    req.session.error = "No se pudo cambiar la contraseña.";
    return req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect("/change-password");
    });
  }
});

export default router;