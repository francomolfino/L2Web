import { findAccountByLogin } from "./accountService.js";
import { verifyGamePassword } from "./passwordAdapter.js";

export async function loginWithGameAccount(login, plainPassword) {
  const account = await findAccountByLogin(login);
  if (!account) return null;
  if (Number(account.accessLevel) < 0) return null;

  const ok = verifyGamePassword(plainPassword, account.password);
  if (!ok) return null;

  return {
    login: account.login
  };
}