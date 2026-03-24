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
  console.log("[verifyAdminRequest] Checking admin request...");
  const secret = adminSecretFromRequest(request);
  console.log("[verifyAdminRequest] x-admin-secret header value:", secret);
  
  if (verifyAdminSecret(secret)) {
    console.log("[verifyAdminRequest] Admin secret VERIFIED");
    return true;
  }
  console.log("[verifyAdminRequest] Admin secret FAILED, checking cookie...");
  
  const raw = request.headers.get("cookie");
  console.log("[verifyAdminRequest] Cookie header present:", !!raw);
  
  if (!raw) {
    console.log("[verifyAdminRequest] No cookie found, rejecting");
    return false;
  }
  
  const match = raw.match(/(?:^|;\s*)fh_admin_sig=([^;]+)/);
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  const isValid = isValidAdminCookie(value);
  console.log("[verifyAdminRequest] Cookie fh_admin_sig found:", !!value, ", valid:", isValid);
  return isValid;
}
