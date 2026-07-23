import { pool } from "../../db/pool";
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

export async function upsertLocation(
  user: AuthenticatedUser,
  input: LocationUpdateInput,
): Promise<LocationRecord> {
  const isWaiting = user.role === "driver" ? true : Boolean(input.isWaiting);

  const result = await pool.query<LocationRow>(
    `INSERT INTO locations (user_id, employee_id, role, lat, lng, is_waiting, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id) DO UPDATE
       SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, is_waiting = EXCLUDED.is_waiting, updated_at = now()
     RETURNING user_id, employee_id, role, lat, lng, is_waiting, updated_at`,
    [user.id, user.employeeId, user.role, input.lat, input.lng, isWaiting],
  );

  return toRecord(result.rows[0]);
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
