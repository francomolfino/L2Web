import crypto from "crypto";

export function hashGamePassword(plainText) {
  const sha1 = crypto.createHash("sha1").update(plainText).digest();
  return sha1.toString("base64");
}

export function verifyGamePassword(plainText, storedHash) {
  return hashGamePassword(plainText) === storedHash;
}