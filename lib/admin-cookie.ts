import { createHmac, timingSafeEqual } from "crypto";

const SALT = "faith-hack-admin-v1";

export function signAdminSession(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET is not set");
  }
  return createHmac("sha256", secret).update(SALT).digest("base64url");
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!value || !process.env.ADMIN_SECRET) return false;
  try {
    const expected = signAdminSession();
    const a = Buffer.from(value, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
