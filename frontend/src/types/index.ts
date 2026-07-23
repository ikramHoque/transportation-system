export type UserRole = "engineer" | "staff" | "admin" | "driver";

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

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AllowedEmployee {
  employee_id: string;
  role: UserRole;
  note: string | null;
  created_at: string;
  is_registered: boolean;
}
