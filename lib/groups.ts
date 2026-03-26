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

export const FIXED_GROUP_NAMES = [
  "Slick Python",
  "Java Juggernauts",
  "C++ Commanders",
] as const;

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

  let list = groups ?? [];

  if (list.length === 0) {
    const toInsert = FIXED_GROUP_NAMES.map((name, index) => ({
      event_id: eventId,
      name,
      color: GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
    }));

    const { data: createdGroups, error: insertError } = await supabase
      .from("groups")
      .insert(toInsert)
      .select("id, name, color");

    if (insertError) {
      throw new Error(insertError.message);
    }
    list = createdGroups ?? [];
  }

  // Find member counts for all groups to determine the new position
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

  // Prioritize groups with the lowest number of members
  const minCount = Math.min(...counts.map((c) => c.count));
  const candidateGroups = counts.filter((c) => c.count === minCount);

  // Randomly assign to one of the candidate groups
  const randomIndex = Math.floor(Math.random() * candidateGroups.length);
  const chosen = candidateGroups[randomIndex];
  
  const chosenGroup = chosen.group;
  const position = chosen.count + 1;

  return {
    groupId: chosenGroup.id,
    groupName: chosenGroup.name,
    groupColor: chosenGroup.color,
    position,
    memberCount: position,
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
