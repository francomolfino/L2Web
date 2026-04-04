import crypto from "crypto";
import { db } from "../db/db.js";
import { config } from "../config.js";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createRecoveryToken(accountName) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * config.tokenExpirationMinutes);

  // 🔴 invalidar tokens anteriores
  await db.query(
    `UPDATE web_password_resets
     SET used_at = NOW()
     WHERE account_name = ? AND used_at IS NULL`,
    [accountName]
  );

  await db.query(
    `INSERT INTO web_password_resets (account_name, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [accountName, tokenHash, expiresAt]
  );

  return rawToken;
}

export async function consumeRecoveryToken(rawToken) {
  const tokenHash = sha256(rawToken);

  const rows = await db.query(
    `SELECT id, account_name
     FROM web_password_resets
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const row = rows[0];
  if (!row) return null;

  await db.query(
    "UPDATE web_password_resets SET used_at = NOW() WHERE id = ?",
    [row.id]
  );

  return row.account_name;
}