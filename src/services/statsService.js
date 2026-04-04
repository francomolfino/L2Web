import { db } from "../db/db.js";
import { getClassName } from "./classNames.js";

function mapRow(row) {
  return {
    char_name: row.char_name,
    level: row.level,
    classid: row.classid,
    class_name: getClassName(row.classid),
    pvpkills: row.pvpkills ?? 0,
    pkkills: row.pkkills ?? 0,
    clan_name: row.clan_name || "-"
  };
}

export async function getOnlinePlayersCount() {
  const rows = await db.query(
    "SELECT COUNT(*) AS total FROM characters WHERE online = 1"
  );

  return Number(rows[0]?.total || 0);
}

export async function getTopPvp(limit = 5) {
  const rows = await db.query(
    `SELECT
        c.char_name,
        c.level,
        c.classid,
        c.pvpkills,
        c.pkkills,
        cd.clan_name
     FROM characters c
     LEFT JOIN clan_data cd ON cd.clan_id = c.clanid
     ORDER BY c.pvpkills DESC, c.level DESC, c.char_name ASC
     LIMIT ?`,
    [limit]
  );

  return (rows || []).map(mapRow);
}

export async function getTopPk(limit = 5) {
  const rows = await db.query(
    `SELECT
        c.char_name,
        c.level,
        c.classid,
        c.pvpkills,
        c.pkkills,
        cd.clan_name
     FROM characters c
     LEFT JOIN clan_data cd ON cd.clan_id = c.clanid
     ORDER BY c.pkkills DESC, c.level DESC, c.char_name ASC
     LIMIT ?`,
    [limit]
  );

  return (rows || []).map(mapRow);
}