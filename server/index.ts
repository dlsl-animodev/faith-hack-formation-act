import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSocketServer } from "@/lib/socket/server-io";
import { registerSessionHandler } from "./handlers/session.handler";
import { registerGroupHandler } from "./handlers/group.handler";
import { registerPhaseHandler } from "./handlers/phase.handler";
import { registerSubmissionHandler } from "./handlers/submission.handler";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

export async function startServer(): Promise<void> {
  const app = next({ dev });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  const corsOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  setSocketServer(io);

  const supabase = createAdminClient();

  io.on("connection", (socket) => {
    const secret = process.env.ADMIN_SECRET;
    const auth = socket.handshake.auth as
      | { adminSecret?: string; eventSubscriber?: string }
      | undefined;

    if (secret && auth?.adminSecret === secret) {
      socket.data.isAdmin = true;
      void socket.join("admin");
    }

    const sub = auth?.eventSubscriber;
    if (typeof sub === "string" && sub.length > 0) {
      void socket.join(`event:${sub}`);
    }

    registerSessionHandler(io, socket, supabase);
    registerPhaseHandler(io, socket, supabase);
    registerSubmissionHandler(io, socket, supabase);
    registerGroupHandler(io, socket);
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, hostname, () => resolve());
  });

  console.log(`Faith Hack ready at http://localhost:${port}`);
}
