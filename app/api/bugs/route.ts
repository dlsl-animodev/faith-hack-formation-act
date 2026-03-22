import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { bugsBodySchema } from "@/lib/schemas";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bugsBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid body");
  }

  const { sessionId, bugs } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) {
      return jsonErr("Session not found", 404);
    }

    const { error: delErr } = await supabase.from("bugs").delete().eq("session_id", sessionId);
    if (delErr) {
      return jsonErr(delErr.message, 500);
    }

    const rows = bugs.map((b) => ({
      session_id: sessionId,
      label: sanitizeText(b.label, 500),
      is_custom: b.is_custom,
    }));

    const { error: insErr } = await supabase.from("bugs").insert(rows);
    if (insErr) {
      return jsonErr(insErr.message, 500);
    }

    return jsonOk({ saved: true as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
