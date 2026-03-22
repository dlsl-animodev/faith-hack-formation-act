# Faith Hack

Structured spiritual formation for small groups (e.g. IT/engineering students), framed with a developer metaphor: bugs, debugging, deployment, and restoration. This repo is a **Next.js 14** app (App Router) designed to run on **Vercel** or any Node host. **Realtime** uses **Supabase Realtime Broadcast** (no custom WebSocket server).

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript (strict)
- **UI:** Tailwind CSS, Framer Motion, `qrcode.react`
- **State:** Zustand
- **Data:** Supabase (PostgreSQL); API routes use the **service role** client for writes
- **Realtime:** Supabase Realtime **Broadcast** on channel `fh_public` (see below)

## Prerequisites

- Node.js 18+ (recommended 20+)
- A [Supabase](https://supabase.com) project with **Realtime enabled** and **Broadcast** allowed for clients using the anon key (default in hosted Supabase for public channels—confirm in **Project Settings → API → Realtime** if messages do not arrive)

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

   ADMIN_SECRET=your-long-random-secret
   ```

   On **Vercel**, set the same variables in the project settings. Set **`NEXT_PUBLIC_APP_URL`** to your production URL (including `https://`) so QR codes and join links are correct.

3. **Database**

   Run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor (or your usual migration workflow).

## Scripts

| Command             | Description        |
|---------------------|--------------------|
| `npm run dev`       | Next.js dev server |
| `npm run build`     | Production build   |
| `npm run start`     | `next start`       |
| `npm run lint`      | ESLint             |
| `npm run typecheck` | `tsc --noEmit`     |

## App routes

| Path | Role |
|------|------|
| `/` | Landing links (admin / host) |
| `/admin/login` | Admin password → signed cookie + `sessionStorage` for `x-admin-secret` on API calls |
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

1. On **`/admin`**, click **Start new event**. That creates a new code, updates global state, and broadcasts so **`/host`** can show the **QR code and join URL**.
2. The host screen shows a **large QR** and the **same URL as text** (for manual entry). The live **participant count** updates as people join.

### How participants join (QR)

1. Participant points a **phone camera** or a **QR app** at the projector QR.
2. The device opens the **join page**: `/join/<eventCode>`.
3. If the code is valid and the event is active, they tap **Enter session**. No login.
4. The app creates a **session**, assigns a **group**, and sends them to **`/participant/<sessionId>`** (that ID is also stored in the browser).

They should **stay on that participant page** for the whole workshop (one tab).

### Phases (what everyone does)

The facilitator moves the room forward from **`/admin`** (phase changes use **`POST /api/admin/phase`**). Participants follow via Realtime + polling.

| Phase | What participants see | What facilitator does |
|------|------------------------|-------------------------|
| **1 — Formation** | Team name, color, “find your teammates” | When groups are settled, click **Advance phase** |
| **2 — Bug checklist** | Private checklist (1–5 items + optional custom); **Save** | When ready, **Advance phase** |
| **3 — Sharing** | Each person sees a **numbered prompt** for discussion | You facilitate conversation in the room; when done, click **End sharing → Phase 4** |
| **4 — Deploy** | **Team leader** (position 1) writes a short summary and **holds “Deploy” for 3 seconds**; others see a waiting state | Wait for each group to submit; you can **Advance phase** to **5** when you want the **projector puzzle** |
| **5 — Puzzle** | Small “assembly” view; their piece **locks** when their group has submitted | **`/host`** shows the big puzzle; pieces animate in as groups deploy. Stay here until all teams have submitted |
| **6 — Completion** | A **completion message** for their group; cinematic end | Happens **automatically** when the **last** group submits (phase goes to 6 and messages are sent). No extra button |

**Host screen behavior:** **`/host`** shows the **QR** while phase is **below 5** (so latecomers can still join). After you **advance to phase 5**, it switches to the **puzzle** and tracks **X / Y groups deployed**.

**Bugs panel:** From phase 3 onward, participants can still open the **bugs** drawer from the floating control to edit their private list.

### Ending the workshop

- When **all groups** have submitted in phase 4/5, the app moves to **phase 6** and delivers messages.
- To **close the event** for everyone (QR invalid, “session ended” on phones, host back to waiting):

  On **`/admin`**, click **End event** and confirm. That deactivates the event, saves a **summary** to the database, resets global phase/counters, and broadcasts to clients.

- Past runs are listed under **`/admin` → Event history** (read-only, paginated).

## API notes

- `GET /api/events/validate/[eventCode]` — validate an active event code
- `POST /api/events/end/[eventId]` — end event (admin auth required)
- `POST /api/admin/phase` — `{ "action": "advance" | "endSharing" }` (admin auth required)

Other handlers live under `app/api/` (create event, active state, session join, bootstrap, bugs, group submit, history, admin login).

## Deploying on Vercel

1. Connect the repo and set **environment variables** (see above).
2. **Build command:** `npm run build`; **Output:** Next.js default.
3. Ensure **Supabase Realtime** works from the browser (anon key). If live updates fail, check Supabase **Realtime** settings and that **`NEXT_PUBLIC_SUPABASE_URL`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** match your project.

## Troubleshooting

- **Live updates not working** — Confirm Realtime is enabled and the browser can open a WebSocket to Supabase. The app also **polls** `/api/events/active` on the host as a fallback.
- **Wrong QR / join URL in production** — Set **`NEXT_PUBLIC_APP_URL`** to your deployed site URL (e.g. `https://your-app.vercel.app`).

## License

Private / use per your organization’s policy.
