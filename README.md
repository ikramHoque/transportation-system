# BJIT Transportation System

Live shuttle tracker for the company bus route **Notunbazar (Badda) → Sayednagar → Pachkhola → BJIT, Satarkul**.

- **Engineers / Staff** see the bus's live location and can mark themselves as "waiting" at a stop, sharing their own location.
- **Driver** sees the bus route map and a live count + map markers of everyone currently waiting, so they know whether to keep the route running.
- **Admin** sees everything — the bus, every waiting rider, live counts — and manages the employee-ID whitelist used for registration.

No names are ever collected. The only identifier in the system is the company **employee ID**.

## Tech stack

| Layer     | Choice                                                              |
|-----------|----------------------------------------------------------------------|
| Frontend  | React + TypeScript (Vite), React Router, React-Leaflet (OpenStreetMap, no API key needed), Socket.IO client |
| Backend   | Express + TypeScript, Socket.IO, JWT auth, Zod validation, bcrypt   |
| Database  | PostgreSQL 16 (plain SQL migrations, no ORM)                        |
| Delivery  | Docker Compose (nginx serves the built frontend and reverse-proxies `/api` + `/socket.io` to the backend) |

## Architecture

```
Browser (React SPA)
   │  HTTPS/WS (relative /api, /socket.io)
   ▼
nginx (frontend container, port 8080)
   │  proxy_pass
   ▼
Express API + Socket.IO (backend container, port 4000)
   │
   ▼
PostgreSQL (db container)
```

Real-time design:
- The **driver's** browser shares its GPS position over a Socket.IO event (`location:update`); the server persists it and broadcasts `driver:location` to every connected client (riders + admin see the bus move).
- A **rider** (engineer/staff) shares their GPS position + a "waiting" flag the same way. The server persists it and broadcasts `waiting:update` (count + roster) only to the `driver` and `admin` roles — that's the "dispatch" room.
- REST endpoints (`GET /api/location/*`) provide the same data for the initial page load / refresh, filtering out stale rows (no update in the last 2 minutes) so a forgotten browser tab doesn't show as "still waiting" forever.
- The waiting roster is also re-broadcast on a fixed 45s timer (`WAITING_REBROADCAST_INTERVAL_MS` in `backend/src/realtime/socket.ts`), regardless of whether any rider's `location:update` fires. Without this, a backgrounded/stale rider's marker would only clear from a driver's *live* view whenever some other rider happened to trigger a broadcast — this bounds that self-healing to a fixed worst case instead.
- Only one source of truth: a `locations` table holds the *current* location per user (not a history log) — the same row is upserted on every update, from both the socket handler and the REST reads.
- **Route geofence**: a rider's `isWaiting` flag is only honored server-side if their reported position is within `ROUTE_GEOFENCE_RADIUS_METERS` (default 500m, in `backend/src/config/route.ts`) of the route polyline — computed via point-to-segment distance in `backend/src/utils/geo.ts`. Someone opening the app away from the route (e.g. from home) can't inflate the waiting count the driver relies on; they get a `location:outOfRange` socket message explaining why they weren't counted. The driver's own location is never geofenced.
- **Auto-pickup detection (multi-shuttle safe)**: with more than one bus on the same route, a rider who boards but never presses "Stop waiting" would otherwise keep showing up as waiting — moving along with whichever bus picked them up — confusing every *other* driver into thinking someone new is still waiting. Instead, the server tracks how long a rider's position has stayed within `PICKUP_RADIUS_METERS` (default 40m, `backend/src/config/tracking.ts`) of *any* currently active driver. Once that holds for `PICKUP_DWELL_SECONDS` (default 15s), the rider is treated as boarded: `is_waiting` is force-cleared regardless of what their client still requests, they're notified via a `location:pickedUp` event (which also flips their local toggle off and stops their geolocation sharing), and they disappear from the waiting roster for *every* driver and admin at once — not just the one who picked them up. The dwell requirement guards against a momentary pass-by (e.g. a red light near a stop) being mistaken for a pickup; the proximity timer resets after firing so a false positive doesn't permanently block the rider from re-marking themselves waiting.

## Single active session

Only one login is honored per employee ID at a time. Each login/register rotates a `session_id` stored on the user row and embeds it in the JWT as the `sid` claim; both REST requests (`requireAuth`) and Socket.IO connections re-check that the token's `sid` still matches the DB before honoring it. Logging in on a second device doesn't just make the old token *eventually* stop working — the moment a new session is issued, any socket already connected under the old session is force-disconnected in real time (sent a `session:invalidated` event first, then dropped), and the old device's UI logs itself out with an explanation. This is enforced by a single in-process event bus (`backend/src/realtime/sessionEvents.ts`); it works correctly with the one backend instance this Compose setup runs, but a horizontally-scaled deployment would need that swapped for a shared pub/sub (e.g. Redis) so a kick issued on one instance reaches sockets connected to another.

Note this enforces one active *login*, not literally one physical device — two tabs in the same browser share the same `localStorage` token, so they're the same session, not a conflict.

## Registration & roles

Registration is **not** open — it requires the employee ID to already exist in the `allowed_employees` whitelist table, which is where the role (`engineer` / `staff` / `driver` / `admin`) is actually assigned. A user just supplies **employee ID + password**; the role is looked up from the whitelist automatically, never chosen by the user.

- Admins manage this whitelist via `POST/PATCH/DELETE /api/admin/employees` (also exposed in the Admin dashboard UI).
- Demo data is seeded automatically on first run (see below) so you can log in immediately — **replace/remove it** before onboarding real employees.

## Running it

Requires Docker + Docker Compose.

```bash
cp .env.example .env
# edit .env — at minimum set a real JWT_SECRET:
#   openssl rand -hex 32

docker compose up -d --build
```

Open **http://localhost:8080** (or whatever `APP_PORT` you set).

The backend runs its own SQL migrations on startup (see `backend/src/db/migrations`), including a demo whitelist seed:

| Employee ID  | Role     |
|--------------|----------|
| `ADMIN-001`  | admin    |
| `DRIVER-001` | driver   |
| `ENG-001`    | engineer |
| `STAFF-001`  | staff    |

Register any of these via the app's Register page with a password of your choice, then log in.

To stop: `docker compose down` (add `-v` to also wipe the database volume).

### Local development (without Docker)

```bash
# Postgres only, via Docker:
docker compose up -d db

# Backend
cd backend
cp .env.example .env   # points at localhost:5432 by default
npm install
npm run dev             # tsx watch, runs migrations on boot, port 4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # Vite dev server, port 5173, proxies /api and /socket.io to :4000
```

## Configuring the real route

`backend/src/config/route.ts` is the single source of truth for the stop list (id, name, lat, lng), served to the frontend via `GET /api/route/stops`. The coordinates shipped are **approximate placeholders** for the Badda–Satarkul corridor — replace them with surveyed coordinates for your actual stops before relying on the map for anything beyond a demo.

## Security & hardening

- Passwords hashed with bcrypt (12 rounds); JWT (12h expiry by default) is the only session mechanism, and only one session per user is honored at a time (see above).
- `helmet` + strict CORS (`CORS_ORIGIN` env var) on the API.
- Rate limiting: `/api/auth/*` limited to 20 requests / 15 min per IP (brute-force mitigation); the rest of the API to 120 requests / min per IP.
- All input validated with Zod at the HTTP boundary (and inline for socket payloads) before touching the database; all SQL is parameterized.
- Employee ID whitelist prevents arbitrary self-registration and arbitrary role self-assignment.

## API summary

| Method | Path                         | Access          | Purpose |
|--------|------------------------------|-----------------|---------|
| POST   | `/api/auth/register`         | public          | Register with a whitelisted employee ID |
| POST   | `/api/auth/login`            | public          | Login |
| GET    | `/api/auth/me`                | any authed user | Current user info |
| GET    | `/api/route/stops`            | any authed user | Fixed route stop list |
| GET    | `/api/location/driver`        | any authed user | Latest active bus location(s) |
| GET    | `/api/location/waiting`       | driver, admin   | Waiting riders + count |
| GET    | `/api/location/summary`       | admin           | Drivers + riders + counts combined |
| GET/POST/PATCH/DELETE | `/api/admin/employees` | admin | Manage the whitelist |

## Socket.IO events

Client connects with `io({ auth: { token } })` (JWT from login/register).

| Event (client → server) | Payload | Who |
|---|---|---|
| `location:update` | `{ lat, lng, isWaiting? }` | driver, engineer, staff |

| Event (server → client) | Payload | Recipients |
|---|---|---|
| `driver:location` | `LocationRecord` | everyone |
| `waiting:update` | `{ count, riders: LocationRecord[] }` | driver + admin only |
| `location:error` | `{ error }` | sender, on invalid payload |
| `location:outOfRange` | `{ message }` | sender, when a rider's `isWaiting: true` was rejected by the route geofence |
| `location:pickedUp` | `{ message }` | sender, when a rider was auto-detected as having boarded a bus |
| `session:invalidated` | `{ message }` | sender, when this connection's session was superseded by a newer login (socket is then force-disconnected) |
