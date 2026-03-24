import { createAdminClient } from "@/lib/supabase/admin";
import { FH_REALTIME_CHANNEL } from "./constants";

/**
 * Broadcasts one message on the shared Realtime channel (works from Vercel serverless).
 * Failures are logged and swallowed so API routes still succeed after DB writes.
 */
export async function realtimeBroadcastFire(
  event: string,
  payload: unknown
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const channel = supabase.channel(FH_REALTIME_CHANNEL, {
      config: { broadcast: { ack: false } },
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const fail = (error: Error, shouldUnsubscribe = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(to);
        if (shouldUnsubscribe) {
          try {
            channel.unsubscribe();
          } catch {
            /* ignore */
          }
        }
        reject(error);
      };

      const succeed = () => {
        if (settled) return;
        settled = true;
        clearTimeout(to);
        try {
          channel.unsubscribe();
        } catch {
          /* ignore */
        }
        resolve();
      };

      const to = setTimeout(() => {
        fail(new Error("Realtime subscribe timeout"), true);
      }, 15_000);

      channel.subscribe((status, err) => {
        if (settled) return;

        if (status === "SUBSCRIBED") {
          void channel
            .send({
              type: "broadcast",
              event,
              payload,
            })
            .then(() => {
              succeed();
            })
            .catch((e) => {
              fail(e instanceof Error ? e : new Error(String(e)), true);
            });
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          // Avoid recursion: CLOSED/ERROR can be triggered by unsubscribe itself.
          fail(err ?? new Error(`Realtime channel: ${status}`));
        }
      });
    });
  } catch (e) {
    console.error("[faith-hack] realtimeBroadcastFire", event, e);
  }
}
