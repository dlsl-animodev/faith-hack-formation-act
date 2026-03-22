import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { submitGroupBodySchema } from "@/lib/schemas";
import { performGroupDebugSubmit } from "@/lib/perform-group-submit";

interface RouteParams {
  params: { groupId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const { groupId } = params;
  if (!groupId) {
    return jsonErr("Missing group", 400);
  }

  const json: unknown = await request.json().catch(() => null);
  const parsed = submitGroupBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid body");
  }

  try {
    const supabase = createAdminClient();
    const result = await performGroupDebugSubmit(supabase, {
      sessionId: parsed.data.sessionId,
      groupId,
      summary: parsed.data.summary,
    });

    if (!result.ok) {
      return jsonErr(result.error, 400);
    }

    return jsonOk({ submitted: true as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
