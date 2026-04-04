import { db } from "../db/db.js";
import { hashGamePassword } from "./passwordAdapter.js";

export async function findAccountByLogin(login) {
  const rows = await db.query(
    "SELECT login, password, email, accessLevel, lastactive FROM accounts WHERE login = ? LIMIT 1",
    [login]
  );
  return rows[0] || null;
}

export async function findAccountByEmail(email) {
  const rows = await db.query(
    "SELECT login, password, email, accessLevel, lastactive FROM accounts WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

export async function createAccount(login, plainPassword, email) {
  const passwordHash = hashGamePassword(plainPassword);

  await db.query(
    `INSERT INTO accounts (login, password, email, created_time, lastactive, accessLevel)
     VALUES (?, ?, ?, NOW(), 0, 0)`,
    [login, passwordHash, email || null]
  );

  return findAccountByLogin(login);
}

export async function updateAccountPassword(login, newPlainPassword) {
  const passwordHash = hashGamePassword(newPlainPassword);

  await db.query(
    "UPDATE accounts SET password = ? WHERE login = ?",
    [passwordHash, login]
  );
}