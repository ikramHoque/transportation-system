/**
 * Single source of truth for the fixed shuttle route so backend and frontend
 * never disagree on stop order/coordinates. Notunbazar -> Satarkul, sourced
 * from a real Google Maps directions route (9 named stops with precise
 * coordinates) rather than approximated.
 */
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

export const ROUTE_STOPS: RouteStop[] = [
  { id: "notunbazar", name: "Notun Bazar", lat: 23.7978186, lng: 90.4236046 },
  { id: "vatara-police-station", name: "Vatara Police Station", lat: 23.797572, lng: 90.4240385 },
  { id: "farazy-hospital", name: "Farazy Diagnostic & Hospital, Natun Bazar", lat: 23.7980155, lng: 90.4278257 },
  { id: "sayednagar", name: "Sayed Nagar Auto Stand", lat: 23.7986813, lng: 90.4348793 },
  {
    id: "oxford-international-school",
    name: "Oxford International School (Gulshan Campus)",
    lat: 23.7989254,
    lng: 90.4385411,
  },
  { id: "bashundhara-gate", name: "Bashundhara Gate, University Gate", lat: 23.8002639, lng: 90.4486682 },
  { id: "gokart-courtside", name: "GoKart Courtside", lat: 23.8005041, lng: 90.4518795 },
  { id: "feroza-garden", name: "Feroza Garden", lat: 23.8016825, lng: 90.4609117 },
  { id: "satarkul", name: "BJIT, Satarkul", lat: 23.8003911, lng: 90.4626517 },
];

/**
 * Max distance (meters) from ROUTE_PATH a rider's reported location may be
 * while still counting as "waiting". Keeps someone opening the app from
 * home (or anywhere off-route) from inflating the waiting count the driver
 * relies on. Widened generously to tolerate GPS drift near the stops.
 */
export const ROUTE_GEOFENCE_RADIUS_METERS = 500;

/**
 * Dense, road-following path from the first to the last ROUTE_STOPS entry
 * -- used for both the map polyline and the geofence distance check.
 * Generated once via a driving-directions request against OSRM's public
 * routing API (router.project-osrm.org, no key required) between just the
 * two endpoints (Notun Bazar -> BJIT, Satarkul), then hand-copied here; it
 * is NOT fetched at runtime. Deliberately routed endpoint-to-endpoint
 * rather than through all 9 stops as mandatory waypoints -- OSRM forces an
 * explicit stop-and-loop maneuver at each waypoint, and several of these
 * stops sit close together on the same road, which produced ugly
 * backtracking loops in the geometry. Verified instead that every named
 * stop in ROUTE_STOPS falls within ~30m of this path, confirming it
 * naturally passes by all of them anyway.
 */
export const ROUTE_PATH: LatLng[] = [
  { lat: 23.797815, lng: 90.423581 }, { lat: 23.797875, lng: 90.424145 }, { lat: 23.798131, lng: 90.425625 },
  { lat: 23.798159, lng: 90.425875 }, { lat: 23.798186, lng: 90.426275 }, { lat: 23.798209, lng: 90.426723 },
  { lat: 23.798212, lng: 90.426959 }, { lat: 23.798221, lng: 90.427228 }, { lat: 23.798281, lng: 90.42795 },
  { lat: 23.798319, lng: 90.428454 }, { lat: 23.798383, lng: 90.429014 }, { lat: 23.798472, lng: 90.430178 },
  { lat: 23.798508, lng: 90.43065 }, { lat: 23.798518, lng: 90.430805 }, { lat: 23.798608, lng: 90.431522 },
  { lat: 23.79867, lng: 90.432074 }, { lat: 23.798691, lng: 90.432229 }, { lat: 23.798712, lng: 90.432459 },
  { lat: 23.798706, lng: 90.432714 }, { lat: 23.798716, lng: 90.432981 }, { lat: 23.798715, lng: 90.43356 },
  { lat: 23.798728, lng: 90.434037 }, { lat: 23.798768, lng: 90.434524 }, { lat: 23.798814, lng: 90.434981 },
  { lat: 23.798852, lng: 90.43554 }, { lat: 23.798943, lng: 90.436737 }, { lat: 23.799004, lng: 90.437471 },
  { lat: 23.799063, lng: 90.438059 }, { lat: 23.799079, lng: 90.438224 }, { lat: 23.799104, lng: 90.438486 },
  { lat: 23.799349, lng: 90.440654 }, { lat: 23.799433, lng: 90.441351 }, { lat: 23.799475, lng: 90.441684 },
  { lat: 23.799672, lng: 90.443261 }, { lat: 23.799697, lng: 90.443406 }, { lat: 23.799856, lng: 90.444695 },
  { lat: 23.799939, lng: 90.445393 }, { lat: 23.800038, lng: 90.446213 }, { lat: 23.800374, lng: 90.448674 },
  { lat: 23.800486, lng: 90.449529 }, { lat: 23.800641, lng: 90.450704 }, { lat: 23.800982, lng: 90.453543 },
  { lat: 23.801072, lng: 90.454316 }, { lat: 23.801146, lng: 90.45494 }, { lat: 23.801224, lng: 90.45553 },
  { lat: 23.801352, lng: 90.456502 }, { lat: 23.801423, lng: 90.457126 }, { lat: 23.801467, lng: 90.457518 },
  { lat: 23.801562, lng: 90.458442 }, { lat: 23.801623, lng: 90.459282 }, { lat: 23.801689, lng: 90.460073 },
  { lat: 23.801763, lng: 90.461004 }, { lat: 23.801863, lng: 90.4622 }, { lat: 23.80193, lng: 90.462859 },
  { lat: 23.801646, lng: 90.461089 }, { lat: 23.801429, lng: 90.461212 }, { lat: 23.801239, lng: 90.461377 },
  { lat: 23.801177, lng: 90.461661 }, { lat: 23.801158, lng: 90.46185 }, { lat: 23.801124, lng: 90.462023 },
  { lat: 23.800977, lng: 90.462489 }, { lat: 23.800849, lng: 90.462627 }, { lat: 23.80072, lng: 90.462672 },
  { lat: 23.800535, lng: 90.462668 }, { lat: 23.800392, lng: 90.462666 },
];
