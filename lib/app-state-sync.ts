import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncTotalGroupsForEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
  const n = count ?? 0;

  await supabase
    .from("app_state")
    .update({
      total_groups: n,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return n;
}

export async function countSubmittedGroups(
  supabase: SupabaseClient,
  eventId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("submitted", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
