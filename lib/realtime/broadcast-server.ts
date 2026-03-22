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
      const to = setTimeout(() => {
        try {
          channel.unsubscribe();
        } catch {
          /* ignore */
        }
        reject(new Error("Realtime subscribe timeout"));
      }, 15_000);

      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(to);
          void channel
            .send({
              type: "broadcast",
              event,
              payload,
            })
            .then(() => {
              try {
                channel.unsubscribe();
              } catch {
                /* ignore */
              }
              resolve();
            })
            .catch((e) => {
              try {
                channel.unsubscribe();
              } catch {
                /* ignore */
              }
              reject(e instanceof Error ? e : new Error(String(e)));
            });
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          clearTimeout(to);
          try {
            channel.unsubscribe();
          } catch {
            /* ignore */
          }
          reject(err ?? new Error(`Realtime channel: ${status}`));
        }
      });
    });
  } catch (e) {
    console.error("[faith-hack] realtimeBroadcastFire", event, e);
  }
}
