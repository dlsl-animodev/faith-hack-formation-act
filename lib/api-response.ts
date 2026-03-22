import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonErr(
  error: string,
  status = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status });
}
