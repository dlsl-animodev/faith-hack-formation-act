import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { historyQuerySchema } from "@/lib/schemas";

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return jsonErr("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid query");
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const supabase = createAdminClient();
    const { data: rows, error, count } = await supabase
      .from("events")
      .select("id, event_code, created_at, ended_at, summary", { count: "exact" })
      .eq("is_active", false)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return jsonErr(error.message, 500);
    }

    return jsonOk({
      items: rows ?? [],
      page,
      limit,
      total: count ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
