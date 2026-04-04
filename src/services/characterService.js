import { db } from "../db/db.js";

export async function getCharactersByAccount(accountName) {
  const rows = await db.query(
    `SELECT char_name, level, classid, online, x, y, z
     FROM characters
     WHERE account_name = ?
     ORDER BY level DESC, char_name ASC`,
    [accountName]
  );

  return rows || [];
}