# How location tracking works

This walks through, step by step, how a user's location gets from their phone to
everyone else's screen, what the server actually calculates along the way, and
why each corner case is handled the way it is. Written to be read top to bottom.

## 1. Where a location reading comes from

The browser's [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
is the only source of location data — there's no server-side calculation of
"where someone is," only of *what to do* with the coordinates the browser hands
over.

- `navigator.geolocation.watchPosition(...)` (in `frontend/src/hooks/useGeolocation.ts`)
  asks the OS for a position and re-invokes a callback whenever the OS decides a
  new one is available. On a phone this is usually GPS; on a laptop it's
  Wi-Fi/IP-based and far less precise.
- Nobody polls for a location — the browser pushes readings to us when it has
  them. This matters later (see §6).

## 2. Who shares, and when

| Role | Shares location? | When |
|---|---|---|
| Driver | Always, automatically | The whole time the Driver dashboard is open |
| Engineer / Staff (rider) | Only when opted in | Only while the "I'm waiting for the bus" toggle is on |
| Admin | Never | Observer only |

The rider must explicitly opt in because sharing location just for having a tab
open would be a real privacy overreach for something this low-stakes. The
driver doesn't need a toggle — being on that dashboard *is* the signal.

## 3. How often a reading gets sent (the transmit interval)

This is a **client-side throttle**, not a server poll:

- Rider: at most once every **20 seconds** (`RiderDashboard.tsx`)
- Driver: at most once every **5 seconds** (`DriverDashboard.tsx`)

Important nuance: this is a *maximum* frequency, not a *guaranteed* one. The
throttle only fires when `watchPosition`'s callback fires, and that callback is
only guaranteed to fire when the browser thinks the position **changed**. If a
rider is standing perfectly still, some browsers slow way down or stop firing
callbacks altogether — there is currently no independent heartbeat that
re-sends an unchanged position on a timer. In practice this is fine because the
2-minute freshness window (§7) is generous relative to normal GPS jitter, but
it's worth knowing this isn't a strict metronome.

## 4. What the server does with a rider's update

Every `location:update` from a rider goes through this pipeline, in order,
inside `backend/src/modules/location/location.service.ts`:

```
incoming { lat, lng, isWaiting }
        │
        ▼
 1. Route geofence check  ──── fails ──► isWaiting forced to false
        │ passes                         (rider notified: location:outOfRange)
        ▼
 2. Auto-pickup check     ──── triggers ─► isWaiting forced to false
        │ doesn't trigger                  (rider notified: location:pickedUp)
        ▼
 3. Upsert to `locations` table (one row per user — current state, not a log)
        │
        ▼
 4. Broadcast the updated waiting roster to driver + admin
```

Two independent checks can each override what the client asked for. Neither
one ever makes the server *invent* a `waiting` state the client didn't
request — they only ever downgrade `true` to `false`.

## 5. Check #1 — the route geofence: is this person even near the route?

**Problem it solves**: someone opens the app from home (or anywhere off the
route) and presses "waiting" — without a check, the driver would see a phantom
waiting rider that doesn't correspond to anywhere on the actual route.

**Algorithm** (`backend/src/utils/geo.ts`, `distanceToPathMeters`):

1. The route (`ROUTE_PATH`) is a list of ~66 `{lat, lng}` points tracing the
   real road from Notun Bazar to BJIT Satarkul (see §9 for where these come
   from).
2. For each consecutive pair of points, treat it as a line segment and compute
   the shortest distance from the rider's position to that segment.
3. Take the minimum across all segments — that's "distance from this point to
   the route."

**Why a projection, not raw lat/lng math**: lat/lng degrees aren't equal-sized
in meters (a degree of longitude shrinks as you move away from the equator).
Doing point-to-segment geometry directly in degrees would distort distances.
Instead, each point is projected into local flat (x, y) meters first using an
equirectangular approximation centered on the segment:

```
x = (lng - originLng) × cos(originLat) × EARTH_RADIUS
y = (lat - originLat) × EARTH_RADIUS
```

This kind of flat-earth approximation is only accurate over short distances —
fine here because the whole route is ~4.5km and every calculation is local to
one segment at a time, never the full route span.

**Threshold**: `ROUTE_GEOFENCE_RADIUS_METERS = 500` meters
(`backend/src/config/route.ts`). Deliberately generous — wide enough to
tolerate normal GPS drift and to not falsely reject someone standing at a stop
slightly off the exact routed line, but tight enough that "opened the app from
home" still gets caught.

**What happens on failure**: `isWaiting` is forced to `false` for that update
only (not permanently) and the rider gets a `location:outOfRange` message so
they know they weren't silently ignored. The driver's own location is *never*
geofenced — only riders.

## 6. Check #2 — auto-pickup: have they actually boarded the bus?

**Problem it solves**: with more than one shuttle on the route, a rider who
boards but forgets to press "Stop waiting" would keep showing up as
"waiting" — except now moving, riding along with whichever bus picked them up.
Every *other* driver watching the shared roster would see a stale, confusing
entry: someone waiting who is actually already being served.

**Algorithm** (`backend/src/config/tracking.ts`,
`backend/src/modules/location/location.service.ts`):

1. On every rider update, compute the straight-line distance from the rider to
   every currently-active driver (fresh within the last 2 minutes — see §7).
2. If the closest driver is within `PICKUP_RADIUS_METERS` (**40m**), the rider
   is "near a driver" for this update.
3. The database tracks `near_driver_since` per rider — a timestamp for when
   they *first* became near any driver, reset to `NULL` the moment they're no
   longer near one.
4. If they've been continuously near a driver for at least
   `PICKUP_DWELL_SECONDS` (**15 seconds**), the server treats this as a real
   pickup: `is_waiting` is forced to `false`, **regardless of what the client
   just asked for**, and it stays that way for as long as they remain near a
   driver.
5. The moment auto-pickup fires, `near_driver_since` is reset back to `NULL` —
   not left latched. This matters for a specific edge case: if this was a false
   trigger (e.g. they're genuinely still waiting next to a bus idling at a red
   light) and they immediately re-press "waiting," they get a **fresh** 15-second
   grace window instead of being instantly re-blocked by a stale timer.

**Why a radius *and* a dwell time, not just proximity**: proximity alone would
misfire constantly — any rider standing near a stopped bus (which is exactly
what "waiting to be picked up" looks like) would immediately register as
"boarded." The dwell requirement distinguishes *stopped next to* from
*sustained alongside*, which is a much stronger signal of actually being on
the bus. 15 seconds was chosen to filter out a bus merely idling at a nearby
light without making a genuinely-boarded rider wait too long to disappear from
the roster.

**What the rider sees**: a `location:pickedUp` socket message ("Looks like
you're on the bus..."), and the frontend auto-flips their local toggle off and
stops sharing location — there's no more reason to track someone once they're
a passenger, not a waiter.

**Interaction with the 20-second transmit interval**: since a rider only sends
an update at most every 20s, the dwell timer's 15-second threshold is
effectively checked on whichever update happens to land after it elapses — so
in practice auto-pickup confirmation takes roughly 20–40 seconds after
boarding, not a precise 15. This is an acceptable trade-off for the reduced
transmit frequency.

## 7. Staleness: what if someone just... stops sending updates?

This can happen for entirely mundane reasons — the tab gets backgrounded (OS
throttles/freezes background JS, especially on mobile), the phone loses signal,
or (per §3) they're just standing still and `watchPosition` isn't firing. Two
independent mechanisms handle this, because they solve different halves of the
problem:

1. **REST reads are always filtered live.** Every `GET /api/location/*`
   query excludes rows not updated in the last **120 seconds**
   (`FRESHNESS_WINDOW` in `location.service.ts`). A page reload always shows
   the true current state.
2. **The push-based live view needed its own fix.** `waiting:update` was
   originally only re-broadcast when *some* rider's `location:update` fired —
   so if the one rider going stale was the only thing that needed pruning, and
   nobody else happened to trigger a broadcast, a driver's already-open
   dashboard could keep showing a stale "waiting" marker indefinitely past the
   2-minute mark. Fixed with a **45-second timer**
   (`WAITING_REBROADCAST_INTERVAL_MS` in `realtime/socket.ts`) that
   re-broadcasts the roster regardless of activity, bounding that self-healing
   to a fixed worst case instead of an unbounded one.

## 8. Multiple devices, same employee ID

Not strictly a "location calculation," but it directly protects the integrity
of the data above: since `locations` is one row per user (not per device), two
simultaneous logins for the same employee would both upsert the same row,
making the displayed marker flip erratically depending on which device's
update landed last. A newer login rotates a `session_id` and force-disconnects
any socket still active under the old one — see the README's "Single active
session" section for the full mechanism.

## 9. Where the route itself comes from, and how OSRM helps

`ROUTE_STOPS` (12 named places) and `ROUTE_PATH` (the ~66-point line used for
both the map and the geofence check in §5) live in `backend/src/config/route.ts`.

- The 12 named stops were sourced from two real Google Maps directions routes
  covering this corridor, not guessed — precise coordinates extracted directly
  from Maps share links.
- `ROUTE_PATH` needs to be a road-following line, not straight segments jumping
  stop to stop — a straight line between two distant stops can cut across
  blocks the real road bends around, both looking wrong on the map and
  wrongly rejecting a rider genuinely standing on that bend.
- **[OSRM](https://project-osrm.org/)** (Open Source Routing Machine) is a free,
  no-API-key routing engine. It was queried **once, offline** — a single HTTP
  request asking for driving directions — and the returned road geometry was
  hand-copied into `route.ts`. It is **not** called at runtime; the deployed
  app has no dependency on it and no network call happens in production.
- **Important lesson learned while generating this**: the first attempt passed
  all 12 named stops to OSRM as mandatory waypoints. OSRM forces the vehicle to
  literally stop-and-continue at every waypoint in order, and several of these
  stops sit close together on the same road — the result was a route that
  **backtracked and looped over the same street segments three times**,
  inflating a real ~4.5km corridor into an 13.5km path with visible
  zigzagging. The fix: request the route between only the *first and last*
  stop, letting OSRM find the natural driving path on its own, then verify
  every named stop independently falls close to that path (all 12 landed
  within ~30m). This produced a clean line with the correct real-world
  distance and zero backtracking.

## Corner cases at a glance

| Scenario | What handles it | Where |
|---|---|---|
| Rider opens app from home, presses "waiting" | Route geofence (500m) rejects it | §5 |
| Rider boards a bus, forgets to toggle off | Auto-pickup detection (40m / 15s dwell) | §6 |
| Two shuttles on the route, one already picked someone up | Auto-pickup clears the shared roster for *every* driver, not just the one who picked them up | §6 |
| False-positive pickup (e.g. bus idling at a light nearby) | Dwell timer resets after firing — re-toggling gets a fresh grace window, not a permanent block | §6 |
| Rider backgrounds the tab / loses signal | 2-minute freshness filters REST reads; 45s periodic rebroadcast self-heals the live socket view | §7 |
| Rider stands still, `watchPosition` stops firing | Tolerated by the generous freshness window; no independent heartbeat exists yet (known gap) | §3, §7 |
| Two devices logged in as the same employee | Newer login invalidates the old session and force-disconnects its socket | §8 |
| Route line/geofence measured against only 4 guessed points | Replaced with 12 real, Maps-sourced stops and a 66-point OSRM-derived road path | §9 |
