import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { adminPhaseBodySchema } from "@/lib/schemas";
import { seedSharingPrompts } from "@/lib/phase-admin";
import { realtimeBroadcastFire } from "@/lib/realtime/broadcast-server";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import type { PhaseNumber } from "@/types";

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return jsonErr("Unauthorized", 401);
  }

  const json: unknown = await request.json().catch(() => null);
  const parsed = adminPhaseBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid body");
  }

  const { action } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data: state, error: stErr } = await supabase
      .from("app_state")
      .select("current_phase, active_event_code")
      .eq("id", 1)
      .single();

    if (stErr) {
      return jsonErr(stErr.message, 500);
    }

    if (!state?.active_event_code) {
      return jsonErr("No active event", 400);
    }

    let phase: PhaseNumber;

    if (action === "advance") {
      const next = Math.min(
        6,
        Math.max(1, (state.current_phase ?? 1) + 1)
      ) as PhaseNumber;

      if (next === 3) {
        await seedSharingPrompts(supabase, state.active_event_code);
      }

      await supabase
        .from("app_state")
        .update({
          current_phase: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      phase = next;
    } else {
      phase = 4;
      await supabase
        .from("app_state")
        .update({
          current_phase: phase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
    }

    await realtimeBroadcastFire(SOCKET_EVENTS.PHASE_CHANGED, { phase });

    return jsonOk({ phase });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
