import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonErr } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test 1: Wildcard select
    console.log("🧪 Test 1: Wildcard select (*)");
    const { data: data1, error: err1 } = await supabase
      .from("app_state")
      .select("*")
      .eq("id", 1)
      .single();
    console.log("  Result:", { data: data1, error: err1 });

    // Test 2: Explicit column select (same as buggy endpoint)
    console.log("🧪 Test 2: Explicit select (current_phase, active_event_code, ...)");
    const { data: data2, error: err2 } = await supabase
      .from("app_state")
      .select("current_phase, active_event_code, total_groups, groups_submitted")
      .eq("id", 1)
      .maybeSingle();
    console.log("  Result:", { data: data2, error: err2 });

    // Test 3: Just current_phase
    console.log("🧪 Test 3: Single column (current_phase only)");
    const { data: data3, error: err3 } = await supabase
      .from("app_state")
      .select("current_phase")
      .eq("id", 1)
      .single();
    console.log("  Result:", { data: data3, error: err3 });

    return jsonOk({
      test1_wildcard: { data: data1, error: err1 },
      test2_explicit: { data: data2, error: err2 },
      test3_single_column: { data: data3, error: err3 },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("❌ Test route error:", msg);
    return jsonErr(msg, 500);
  }
}