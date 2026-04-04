import { db } from "../db/db.js";

export async function writeAuditLog({ accountName = null, actionName, ipAddress = null, details = null }) {
  try {
    await db.query(
      `INSERT INTO web_audit_log (account_name, action_name, ip_address, details)
       VALUES (?, ?, ?, ?)`,
      [accountName, actionName, ipAddress, details]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}