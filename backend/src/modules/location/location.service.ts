import { pool } from "../../db/pool";
import { ROUTE_GEOFENCE_RADIUS_METERS, ROUTE_STOPS } from "../../config/route";
import { PICKUP_DWELL_SECONDS, PICKUP_RADIUS_METERS } from "../../config/tracking";
import { distanceBetweenPointsMeters, distanceToPathMeters } from "../../utils/geo";
import type { AuthenticatedUser, LocationRecord } from "../../types";
import type { LocationUpdateInput } from "./location.schemas";

/** Locations older than this are treated as stale and excluded from "active" views. */
const FRESHNESS_WINDOW = "120 seconds";

interface LocationRow {
  user_id: string;
  employee_id: string;
  role: LocationRecord["role"];
  lat: number;
  lng: number;
  is_waiting: boolean;
  updated_at: string;
}

function toRecord(row: LocationRow): LocationRecord {
  return {
    userId: row.user_id,
    employeeId: row.employee_id,
    role: row.role,
    lat: row.lat,
    lng: row.lng,
    isWaiting: row.is_waiting,
    updatedAt: row.updated_at,
  };
}

export interface UpsertLocationResult {
  record: LocationRecord;
  /** True when the rider requested isWaiting=true but was too far from the route to count. */
  rejectedOutOfRange: boolean;
  /** True when the rider requested isWaiting=true but was auto-cleared for having boarded a bus. */
  autoPickedUp: boolean;
}

/** Rider locations further than this from the route polyline are never counted as "waiting". */
function isWithinRouteGeofence(lat: number, lng: number): boolean {
  const distance = distanceToPathMeters({ lat, lng }, ROUTE_STOPS);
  return distance <= ROUTE_GEOFENCE_RADIUS_METERS;
}

async function upsertDriverLocation(
  user: AuthenticatedUser,
  input: LocationUpdateInput,
): Promise<UpsertLocationResult> {
  const result = await pool.query<LocationRow>(
    `INSERT INTO locations (user_id, employee_id, role, lat, lng, is_waiting, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, now())
     ON CONFLICT (user_id) DO UPDATE
       SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, is_waiting = true, updated_at = now()
     RETURNING user_id, employee_id, role, lat, lng, is_waiting, updated_at`,
    [user.id, user.employeeId, user.role, input.lat, input.lng],
  );

  return { record: toRecord(result.rows[0]), rejectedOutOfRange: false, autoPickedUp: false };
}

async function upsertRiderLocation(
  user: AuthenticatedUser,
  input: LocationUpdateInput,
): Promise<UpsertLocationResult> {
  const requestedWaiting = Boolean(input.isWaiting);
  const rejectedOutOfRange = requestedWaiting && !isWithinRouteGeofence(input.lat, input.lng);
  const geofencedWaiting = rejectedOutOfRange ? false : requestedWaiting;

  const activeDrivers = await getActiveDrivers();
  const riderPoint = { lat: input.lat, lng: input.lng };
  const isNearDriver = activeDrivers.some(
    (driver) => distanceBetweenPointsMeters(riderPoint, { lat: driver.lat, lng: driver.lng }) <= PICKUP_RADIUS_METERS,
  );

  // near_driver_since resets to NULL whenever the rider isn't next to a
  // driver, is set the first moment they become adjacent to one, and is
  // otherwise preserved (not refreshed) so we can measure how long they've
  // stayed put -- once that dwell exceeds PICKUP_DWELL_SECONDS, is_waiting
  // is forced false regardless of what the client asked for. It's then
  // reset to NULL too (rather than left latched), so if this was a false
  // positive and the rider re-presses "waiting" while still next to the
  // same bus, they get a fresh dwell window instead of being auto-cleared
  // again instantly.
  const result = await pool.query<LocationRow>(
    `INSERT INTO locations (user_id, employee_id, role, lat, lng, is_waiting, near_driver_since, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN now() ELSE NULL END, now())
     ON CONFLICT (user_id) DO UPDATE SET
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       near_driver_since = CASE
         WHEN NOT $7 THEN NULL
         WHEN locations.near_driver_since IS NULL THEN now()
         WHEN now() - locations.near_driver_since >= make_interval(secs => $8) THEN NULL
         ELSE locations.near_driver_since
       END,
       is_waiting = CASE
         WHEN $7 AND now() - locations.near_driver_since >= make_interval(secs => $8) THEN false
         ELSE $6
       END,
       updated_at = now()
     RETURNING user_id, employee_id, role, lat, lng, is_waiting, updated_at`,
    [
      user.id,
      user.employeeId,
      user.role,
      input.lat,
      input.lng,
      geofencedWaiting,
      isNearDriver,
      PICKUP_DWELL_SECONDS,
    ],
  );

  const row = result.rows[0];
  const autoPickedUp = requestedWaiting && !rejectedOutOfRange && !row.is_waiting;

  return { record: toRecord(row), rejectedOutOfRange, autoPickedUp };
}

export async function upsertLocation(
  user: AuthenticatedUser,
  input: LocationUpdateInput,
): Promise<UpsertLocationResult> {
  return user.role === "driver" ? upsertDriverLocation(user, input) : upsertRiderLocation(user, input);
}

export async function getActiveDrivers(): Promise<LocationRecord[]> {
  const result = await pool.query<LocationRow>(
    `SELECT user_id, employee_id, role, lat, lng, is_waiting, updated_at
     FROM locations
     WHERE role = 'driver' AND updated_at > now() - interval '${FRESHNESS_WINDOW}'
     ORDER BY updated_at DESC`,
  );
  return result.rows.map(toRecord);
}

export async function getWaitingRiders(): Promise<LocationRecord[]> {
  const result = await pool.query<LocationRow>(
    `SELECT user_id, employee_id, role, lat, lng, is_waiting, updated_at
     FROM locations
     WHERE role IN ('engineer', 'staff')
       AND is_waiting = true
       AND updated_at > now() - interval '${FRESHNESS_WINDOW}'
     ORDER BY updated_at DESC`,
  );
  return result.rows.map(toRecord);
}
