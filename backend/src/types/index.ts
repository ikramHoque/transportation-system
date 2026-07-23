export type UserRole = "engineer" | "staff" | "admin" | "driver";

export const RIDER_ROLES: UserRole[] = ["engineer", "staff"];

export interface JwtPayload {
  sub: string;
  employeeId: string;
  role: UserRole;
  /** Must match the user's current session_id in the DB, or the token is treated as superseded. */
  sid: string;
}

export interface AuthenticatedUser {
  id: string;
  employeeId: string;
  role: UserRole;
}

export interface LocationRecord {
  userId: string;
  employeeId: string;
  role: UserRole;
  lat: number;
  lng: number;
  isWaiting: boolean;
  updatedAt: string;
}
