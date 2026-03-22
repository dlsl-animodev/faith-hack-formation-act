import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidAdminCookieEdge } from "@/lib/admin-cookie-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sig = request.cookies.get("fh_admin_sig")?.value;
    const ok = await isValidAdminCookieEdge(sig, process.env.ADMIN_SECRET);
    if (!ok) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
