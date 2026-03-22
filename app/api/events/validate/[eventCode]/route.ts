import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";

interface RouteParams {
  params: { eventCode: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { eventCode } = params;
  if (!eventCode) {
    return jsonErr("Missing event code", 400);
  }

  try {
    const supabase = createAdminClient();
    const { data: ev, error } = await supabase
      .from("events")
      .select("id, is_active")
      .eq("event_code", eventCode)
      .maybeSingle();

    if (error) {
      return jsonErr(error.message, 500);
    }

    if (!ev?.is_active) {
      return jsonOk({ valid: false as const });
    }

    return jsonOk({ valid: true as const, eventId: ev.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
