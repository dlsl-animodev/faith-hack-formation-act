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

## System flow

Phases are stored in Supabase (`app_state.current_phase` on the singleton row `id = 1`). The facilitator changes the phase from **`/admin`**; participants on **`/participant/[sessionId]`** read phase from bootstrap + realtime updates. The projector on **`/host`** reads **`GET /api/events/active`** (and realtime) to show the QR (phases **1–4**) or the **puzzle** (phase **5+**).

### Before phase 1 — Event open

1. Facilitator signs in at **`/admin/login`** and opens **`/admin`**.
2. **Start new event** runs **`POST /api/events/create`**: inserts a row in **`events`**, sets **`app_state.active_event_code`**, resets counters, and **broadcasts** (`event:started`, participant count, `phase:changed` with phase **1**). **You cannot start a new event while one is already ongoing** — use **End event** first (API returns **409** if something tries anyway).
3. **`/host`** shows a **QR code** and join URL built from **`NEXT_PUBLIC_APP_URL`**. **`/join/[eventCode]`** accepts new participants until the event ends.
4. Each **Enter session** runs **`POST /api/session/join`**: creates a **`sessions`** row, assigns a **`groups`** row, syncs totals, and **broadcasts** updated participant count and **group assignment** so phones and projector stay in sync.

### Phase 1 — Formation

- **What it’s for:** Groups discover their name, color, and each other in the room.
- **Participants see:** Group formation screen (name, color, member count).
- **Facilitator:** When people are settled, click **Advance phase** → **`POST /api/admin/phase`** with `{ "action": "advance" }` (increments phase, **broadcasts** `phase:changed`).
- **Host:** Still shows **QR** so latecomers can join.

### Phase 2 — Bug checklist

- **What it’s for:** Each person privately selects “bugs” (metaphor) they’re bringing into the workshop.
- **Participants see:** Checklist UI; saving persists **bugs** linked to their **session**.
- **Facilitator:** Click **Advance phase** when the room is ready for discussion.

### Phase 3 — Group sharing

- **What it’s for:** Guided sharing prompts by seat order in each group.
- **What happens when entering phase 3:** Advancing from phase **2 → 3** runs **`seedSharingPrompts`**: rows in **`sharing_prompts`** are created per session so each participant gets the right **prompt text** for their **position**.
- **Participants see:** Sharing UI with their prompt.
- **Facilitator:** Uses **End sharing → Phase 4** (not the generic advance) → **`POST /api/admin/phase`** with `{ "action": "endSharing" }`, which sets phase to **4** and **broadcasts** `phase:changed`.

### Phase 4 — Deploy (debug submission)

- **What it’s for:** Each group “deploys” a short written summary; only the **team leader** (position 1) can submit for the group.
- **Participants see:** Leader holds **Deploy** for a few seconds; **`POST /api/groups/[groupId]/submit`** updates the **group** (`submitted`, summary text) and **app_state** submission counts, then **broadcasts** puzzle/progress events (`group:submitted`, `puzzle:pieceLocked`, etc.).
- **Facilitator:** Waits for groups to finish; may **Advance phase** to **5** when you want the big-screen puzzle (projector switches from QR to puzzle grid).

### Phase 5 — Puzzle

- **What it’s for:** Collective “assembly” view: each group’s piece appears on **`/host`** as groups complete phase 4.
- **Participants see:** A small puzzle view; their piece **locks** once their group has submitted.
- **Host:** Full puzzle grid and **X / Y groups submitted** style progress.
- **Facilitator:** Stays here until all teams have deployed; no separate button is required to “finish” the puzzle—completion is driven by submissions.

### Phase 6 — Completion

- **What it’s for:** A closing message unique to each group.
- **What happens:** When the **last** group submits in phase 4 logic, the backend sets **`app_state.current_phase`** to **6** and **broadcasts** `phase:changed` and **per-group** `completion:message` payloads so each phone shows its group’s message.
- **Participants see:** Completion screen with title + body from their group’s stored message.
- **Facilitator:** No extra phase button for this; optionally **End event** on **`/admin`** to deactivate the event, clear **`app_state.active_event_code`**, save a summary, and **broadcast** `event:ended`.

### Quick reference (phases at a glance)

| Phase | Name | Main actor | Typical advance |
|-------|------|--------------|-----------------|
| 1 | Formation | Participants find team | Facilitator **Advance phase** |
| 2 | Bug checklist | Private bug selection | Facilitator **Advance phase** |
| 3 | Sharing | Prompted discussion | Facilitator **End sharing → Phase 4** |
| 4 | Deploy | Leader submits summary | Facilitator **Advance phase** → 5 when ready |
| 5 | Puzzle | Host + phones | Automatic move to 6 when last group submits |
| 6 | Completion | Per-group message | Facilitator **End event** when workshop is over |

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

1. On **`/admin`**, click **Start new event** (disabled while an event is active). That creates a new code, updates global state, and broadcasts so **`/host`** can show the **QR code and join URL**. To run another workshop later, **End event** first, then **Start new event** again.
2. The host screen shows a **large QR** and the **same URL as text** (for manual entry). The live **participant count** updates as people join.

### How participants join (QR)

1. Participant points a **phone camera** or a **QR app** at the projector QR.
2. The device opens the **join page**: `/join/<eventCode>`.
3. If the code is valid and the event is active, they tap **Enter session**. No login.
4. The app creates a **session**, assigns a **group**, and sends them to **`/participant/<sessionId>`** (that ID is also stored in the browser).

They should **stay on that participant page** for the whole workshop (one tab).

Full phase-by-phase behavior (data model, APIs, broadcasts) is in **[System flow](#system-flow)** above. Here is the short facilitator view:

| Phase | What participants see | What you do on `/admin` |
|------|------------------------|-------------------------|
| **1 — Formation** | Team name, color, find teammates | **Advance phase** when settled |
| **2 — Bug checklist** | Private bug list; **Save** | **Advance phase** when ready |
| **3 — Sharing** | Numbered prompt per seat | **End sharing → Phase 4** when discussion ends |
| **4 — Deploy** | Leader **holds Deploy** to submit summary | Wait for groups; **Advance phase** to **5** for the big puzzle |
| **5 — Puzzle** | Small puzzle; piece locks after their group deploys | Stay until all have deployed; phase **6** happens automatically |
| **6 — Completion** | Group-specific closing message | **End event** when the workshop is fully over |

**Host (`/host`):** Shows the **QR** until phase **5**, then the **puzzle** and submission progress.

**Bugs drawer:** From phase **3** onward, participants can still open the floating **bugs** panel to edit their list.

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
