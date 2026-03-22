const SALT = "faith-hack-admin-v1";

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return x === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signAdminSessionEdge(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SALT));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function isValidAdminCookieEdge(
  value: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!value || !secret) return false;
  try {
    const expected = await signAdminSessionEdge(secret);
    return timingSafeEqualStr(value, expected);
  } catch {
    return false;
  }
}
