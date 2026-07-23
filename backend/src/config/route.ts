/**
 * Single source of truth for the fixed shuttle route so backend and frontend
 * never disagree on stop order/coordinates. Coordinates below are approximate
 * (Notunbazar/Badda -> Satarkul corridor, Dhaka) — replace with surveyed
 * lat/lng before relying on them for anything beyond map display.
 */
export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const ROUTE_STOPS: RouteStop[] = [
  { id: "notunbazar", name: "Notunbazar, Badda", lat: 23.7929, lng: 90.4245 },
  { id: "sayednagar", name: "Sayednagar", lat: 23.7845, lng: 90.4285 },
  { id: "pachkhola", name: "Pachkhola", lat: 23.777, lng: 90.431 },
  { id: "satarkul", name: "BJIT, Satarkul", lat: 23.7715, lng: 90.434 },
];

/**
 * Max distance (meters) from the route polyline a rider's reported location
 * may be while still counting as "waiting". Keeps someone opening the app
 * from home (or anywhere off-route) from inflating the waiting count the
 * driver relies on. Widened generously to tolerate GPS drift near the stops.
 */
export const ROUTE_GEOFENCE_RADIUS_METERS = 500;
