import type { SupabaseClient } from "@supabase/supabase-js";
import { promptForPosition } from "@/lib/sharing-prompts";

export async function seedSharingPrompts(
  supabase: SupabaseClient,
  eventCode: string
): Promise<void> {
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("event_code", eventCode)
    .single();
  if (!ev) return;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, group_id, position")
    .eq("event_id", ev.id)
    .not("group_id", "is", null);

  if (!sessions?.length) return;

  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    const { error: delErr } = await supabase
      .from("sharing_prompts")
      .delete()
      .in("session_id", sessionIds);
    if (delErr) throw new Error(delErr.message);
  }

  const rows = sessions.map((s) => ({
    session_id: s.id,
    group_id: s.group_id as string,
    position: s.position,
    prompt_text: promptForPosition(s.position),
  }));

  const { error } = await supabase.from("sharing_prompts").insert(rows);
  if (error) throw new Error(error.message);
}
