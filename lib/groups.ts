import type { SupabaseClient } from "@supabase/supabase-js";

export const GROUP_COLOR_PALETTE = [
  "#7c6af7",
  "#f7a26a",
  "#4af7a2",
  "#6ab8f7",
  "#f76a9d",
  "#9df76a",
  "#f7e66a",
  "#6af7e6",
  "#c76af7",
  "#f7966a",
] as const;

function groupLabel(index: number): string {
  if (index === 0) return "Team Alpha";
  const n = index + 1;
  return `Node ${String(n).padStart(2, "0")}`;
}

export async function assignSessionToGroup(
  supabase: SupabaseClient,
  eventId: string
): Promise<{
  groupId: string;
  groupName: string;
  groupColor: string;
  position: number;
  memberCount: number;
}> {
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (groupsError) {
    throw new Error(groupsError.message);
  }

  const list = groups ?? [];

  const counts = await Promise.all(
    list.map(async (g) => {
      const { count, error } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("group_id", g.id);
      if (error) throw new Error(error.message);
      return { group: g, count: count ?? 0 };
    })
  );

  const withRoom = counts.find((c) => c.count < 5);

  if (withRoom) {
    const position = withRoom.count + 1;
    return {
      groupId: withRoom.group.id,
      groupName: withRoom.group.name,
      groupColor: withRoom.group.color,
      position,
      memberCount: position,
    };
  }

  const nextIndex = list.length;
  const name = groupLabel(nextIndex);
  const color = GROUP_COLOR_PALETTE[nextIndex % GROUP_COLOR_PALETTE.length];

  const { data: created, error: insertError } = await supabase
    .from("groups")
    .insert({ event_id: eventId, name, color })
    .select("id, name, color")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Failed to create group");
  }

  return {
    groupId: created.id,
    groupName: created.name,
    groupColor: created.color,
    position: 1,
    memberCount: 1,
  };
}

export async function getGroupMemberCount(
  supabase: SupabaseClient,
  groupId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
