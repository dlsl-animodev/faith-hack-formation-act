import { isValidAdminCookie } from "./admin-cookie";

export function adminSecretFromRequest(request: Request): string | null {
  return request.headers.get("x-admin-secret");
}

export function verifyAdminSecret(secret: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !secret) return false;
  return secret === expected;
}

export function verifyAdminRequest(request: Request): boolean {
  if (verifyAdminSecret(adminSecretFromRequest(request))) return true;
  const raw = request.headers.get("cookie");
  if (!raw) return false;
  const match = raw.match(/(?:^|;\s*)fh_admin_sig=([^;]+)/);
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return isValidAdminCookie(value);
}
