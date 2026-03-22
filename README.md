# Faith Hack

Structured spiritual formation for small groups (e.g. IT/engineering students), framed with a developer metaphor: bugs, debugging, deployment, and restoration. This repo is a **Next.js 14** app with a **custom Node server** that serves the App Router and **Socket.IO** on the same HTTP port.

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript (strict)
- **UI:** Tailwind CSS, Framer Motion, `qrcode.react`
- **State:** Zustand
- **Data:** Supabase (PostgreSQL); API routes and the socket server use the **service role** client for writes
- **Realtime:** Socket.IO (attached to the same `http.Server` as Next)

## Prerequisites

- Node.js 18+ (recommended 20+)
- A [Supabase](https://supabase.com) project

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the placeholders below into `.env.local` and replace with your project values. **Do not commit real secrets.**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   PORT=3000

   ADMIN_SECRET=your-long-random-secret
   ```

   Optional:

   - **`BIND_HOST`** — HTTP bind address. If unset, Node chooses a default that works with `http://localhost:PORT` on most machines (including Windows Git Bash). Use `BIND_HOST=0.0.0.0` to listen on all IPv4 interfaces.

3. **Database**

   Run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor (or your usual migration workflow).

## Scripts

| Command            | Description |
|--------------------|-------------|
| `npm run dev`      | Custom server + Next in dev (`tsx watch server.ts`) |
| `npm run build`    | Production Next build |
| `npm run start`    | Production custom server (`NODE_ENV=production tsx server.ts`) |
| `npm run lint`     | ESLint |
| `npm run typecheck`| `tsc --noEmit` |

**Important:** Use `npm run dev` / `npm run start`, not `next dev` / `next start`, so Socket.IO shares the process with Next and `getSocketServer()` works from API routes.

On Windows **cmd**, `npm run start` may not set `NODE_ENV`; use PowerShell, Git Bash, or run `set NODE_ENV=production` (cmd) before `npx tsx server.ts`.

## App routes

| Path | Role |
|------|------|
| `/` | Landing links (admin / host) |
| `/admin/login` | Admin password → signed cookie + `sessionStorage` for socket auth |
| `/admin` | Facilitator controls, event history |
| `/host` | Projector: QR until phase 5, then puzzle grid |
| `/join/[eventCode]` | Participant entry from QR |
| `/participant/[sessionId]` | Participant experience (phases 1–6) |

## Using the system

### Pages you will use

| Who | Open this URL |
|-----|----------------|
| Anyone (landing) | `/` — shortcuts to Admin and Host |
| Facilitator (first time) | `/admin/login` — enter `ADMIN_SECRET`, then you are sent to `/admin` |
| Facilitator (during event) | `/admin` — start/end event, advance phases, end sharing |
| Projector / big screen | `/host` — QR code (early phases) and puzzle grid (phase 5+) |
| Participant (after scanning QR) | `/join/<eventCode>` — then redirected to `/participant/<sessionId>` |

The **event code** looks like `FH-2025-A4X9`. The **join link** (encoded in the QR) is:

`{NEXT_PUBLIC_APP_URL}/join/{eventCode}`  
(e.g. `http://localhost:3000/join/FH-2025-A4X9` in local dev).

### Before participants arrive

1. Run the app (`npm run dev` or production equivalent).
2. Facilitator: `/admin/login` → sign in → `/admin`.
3. Open **`/host`** on the projector (full-screen browser). Leave **`/admin`** open on the facilitator laptop.

### Starting the event

1. On **`/admin`**, click **Start new event**. That creates a new code, updates global state, and broadcasts to **`/host`** so the **QR code and join URL** refresh.
2. The host screen shows a **large QR** and the **same URL as text** (for manual entry). The live **participant count** updates as people join.

### How participants join (QR)

1. Participant points a **phone camera** or a **QR app** at the projector QR.
2. The device opens the **join page**: `/join/<eventCode>`.
3. If the code is valid and the event is active, they tap **Enter session**. No login.
4. The app creates a **session**, assigns a **group**, and sends them to **`/participant/<sessionId>`** (that ID is also stored in the browser).

They should **stay on that participant page** for the whole workshop (one tab).

### Phases (what everyone does)

The facilitator moves the room forward from **`/admin`**. Participants follow automatically on their phones.

| Phase | What participants see | What facilitator does |
|------|------------------------|-------------------------|
| **1 — Formation** | Team name, color, “find your teammates” | When groups are settled, click **Advance phase** |
| **2 — Bug checklist** | Private checklist (1–5 items + optional custom); **Save** | When ready, **Advance phase** |
| **3 — Sharing** | Each person sees a **numbered prompt** for discussion | You facilitate conversation in the room; when done, click **End sharing → Phase 4** (not the generic advance) |
| **4 — Deploy** | **Team leader** (position 1) writes a short summary and **holds “Deploy” for 3 seconds**; others see a waiting state | Wait for each group to submit; you can **Advance phase** to **5** when you want the **projector puzzle** |
| **5 — Puzzle** | Small “assembly” view; their piece **locks** when their group has submitted | **`/host`** shows the big puzzle; pieces animate in as groups deploy. Stay here until all teams have submitted |
| **6 — Completion** | A **completion message** for their group; cinematic end | Happens **automatically** when the **last** group submits (phase goes to 6 and messages are sent). No extra button |

**Host screen behavior:** **`/host`** shows the **QR** while phase is **below 5** (so latecomers can still join). After you **advance to phase 5**, it switches to the **puzzle** and tracks **X / Y groups deployed**.

**Bugs panel:** From phase 3 onward, participants can still open the **bugs** drawer from the floating control to edit their private list.

### Ending the workshop

- When **all groups** have submitted in phase 4/5, the app moves to **phase 6** and delivers messages.
- To **close the event** for everyone (QR invalid, “session ended” on phones, host back to waiting):

  On **`/admin`**, click **End event** and confirm. That deactivates the event, saves a **summary** to the database, resets global phase/counters, and notifies connected clients.

- Past runs are listed under **`/admin` → Event history** (read-only, paginated).

## API notes

Next.js cannot use two different dynamic segment names under the same path segment. Event APIs therefore use:

- `GET /api/events/validate/[eventCode]` — validate an active event code
- `POST /api/events/end/[eventId]` — end event (admin auth required)

Other handlers live under `app/api/` (create event, active state, session join, bootstrap, bugs, group submit, history, admin login).

## Troubleshooting

- **`ERR_CONNECTION_REFUSED` on `localhost` while the server logs “ready”**  
  Do not bind using the shell’s `HOSTNAME` (Git Bash on Windows sets it to the machine name). This project uses optional **`BIND_HOST`** only; leaving it unset avoids that pitfall.

- **Sockets not updating**  
  Ensure `NEXT_PUBLIC_SOCKET_URL` matches the URL you open in the browser (same origin as the custom server, typically `http://localhost:3000` in development).

## License

Private / use per your organization’s policy.
