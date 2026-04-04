import { db } from "../db/db.js";
import { getClassName } from "./classNames.js";

function formatOnlineTime(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) {
    return null;
  }

  const total = Number(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return `${hours}h ${minutes}m ${secs}s`;
}

export async function getCharactersByAccount(accountName) {
  const rows = await db.query(
    `SELECT
        c.char_name,
        c.title,
        c.level,
        c.createDate,
        c.classid,
        c.online,
        c.pvpkills,
        c.pkkills,
        c.karma,
        c.onlinetime,
        c.clanid,
        cd.clan_name,
        cd.ally_name
    FROM characters c
    LEFT JOIN clan_data cd ON cd.clan_id = c.clanid
    WHERE c.account_name = ?
    ORDER BY c.level DESC, c.char_name ASC`,
    [accountName]
  );

  return (rows || []).map((char) => ({
    ...char,
    class_name: getClassName(char.classid),
    clan_name: char.clan_name || "-",
    ally_name: char.ally_name || "-",
    online_label: Number(char.online) === 1 ? "Online" : "Offline",
    online_time_formatted: formatOnlineTime(char.onlinetime),
    pvpkills: char.pvpkills ?? 0,
    pkkills: char.pkkills ?? 0,
    karma: char.karma ?? 0
  }));
}