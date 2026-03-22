import { NextResponse } from "next/server";
import { adminLoginBodySchema } from "@/lib/schemas";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { verifyAdminSecret } from "@/lib/admin-request";
import { signAdminSession } from "@/lib/admin-cookie";

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = adminLoginBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid body");
  }

  if (!verifyAdminSecret(parsed.data.secret)) {
    return jsonErr("Invalid secret", 401);
  }

  let sig: string;
  try {
    sig = signAdminSession();
  } catch {
    return jsonErr("Server misconfigured", 500);
  }

  const res = NextResponse.json({ success: true as const, data: { ok: true } });
  res.cookies.set("fh_admin_sig", sig, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
