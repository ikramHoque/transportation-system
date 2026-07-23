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

export interface LatLng {
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
 * Max distance (meters) from ROUTE_PATH a rider's reported location may be
 * while still counting as "waiting". Keeps someone opening the app from
 * home (or anywhere off-route) from inflating the waiting count the driver
 * relies on. Widened generously to tolerate GPS drift near the stops.
 */
export const ROUTE_GEOFENCE_RADIUS_METERS = 500;

/**
 * Dense, road-following path connecting ROUTE_STOPS in order -- used for
 * both the map polyline and the geofence distance check, so neither is
 * measured against the crude straight lines you'd get from just the 4
 * named stops. Generated once via a driving-directions request against
 * OSRM's public routing API (router.project-osrm.org, no key required)
 * over the ROUTE_STOPS coordinates above, then hand-copied here -- it is
 * NOT fetched at runtime. Since it's only as accurate as those 4 input
 * coordinates (themselves approximate), regenerate it the same way once
 * real surveyed stop coordinates are available.
 */
export const ROUTE_PATH: LatLng[] = [
  { lat: 23.792899, lng: 90.424494 }, { lat: 23.792267, lng: 90.424607 }, { lat: 23.791196, lng: 90.424799 },
  { lat: 23.790665, lng: 90.424893 }, { lat: 23.789107, lng: 90.425175 }, { lat: 23.78897, lng: 90.425196 },
  { lat: 23.787824, lng: 90.425409 }, { lat: 23.787465, lng: 90.425462 }, { lat: 23.787319, lng: 90.425473 },
  { lat: 23.78663, lng: 90.425578 }, { lat: 23.785751, lng: 90.425736 }, { lat: 23.784354, lng: 90.425899 },
  { lat: 23.784346, lng: 90.426223 }, { lat: 23.784294, lng: 90.426585 }, { lat: 23.784258, lng: 90.427069 },
  { lat: 23.784237, lng: 90.42778 }, { lat: 23.784258, lng: 90.428614 }, { lat: 23.784458, lng: 90.428619 },
  { lat: 23.784594, lng: 90.428558 }, { lat: 23.784732, lng: 90.428495 }, { lat: 23.784943, lng: 90.428309 },
  { lat: 23.785094, lng: 90.428214 }, { lat: 23.785314, lng: 90.428102 }, { lat: 23.785465, lng: 90.428055 },
  { lat: 23.785553, lng: 90.428511 }, { lat: 23.785492, lng: 90.428126 }, { lat: 23.785314, lng: 90.428102 },
  { lat: 23.785094, lng: 90.428214 }, { lat: 23.784943, lng: 90.428309 }, { lat: 23.784836, lng: 90.428423 },
  { lat: 23.784594, lng: 90.428558 }, { lat: 23.784458, lng: 90.428619 }, { lat: 23.784258, lng: 90.428614 },
  { lat: 23.784237, lng: 90.42778 }, { lat: 23.784258, lng: 90.427069 }, { lat: 23.784294, lng: 90.426585 },
  { lat: 23.784346, lng: 90.426223 }, { lat: 23.784359, lng: 90.426044 }, { lat: 23.783284, lng: 90.425862 },
  { lat: 23.78069, lng: 90.425676 }, { lat: 23.780551, lng: 90.425672 }, { lat: 23.779753, lng: 90.425667 },
  { lat: 23.778776, lng: 90.425698 }, { lat: 23.777977, lng: 90.425787 }, { lat: 23.77784, lng: 90.425808 },
  { lat: 23.777383, lng: 90.425849 }, { lat: 23.776888, lng: 90.425875 }, { lat: 23.776841, lng: 90.426675 },
  { lat: 23.776772, lng: 90.426932 }, { lat: 23.776778, lng: 90.427156 }, { lat: 23.77679, lng: 90.427385 },
  { lat: 23.77681, lng: 90.42792 }, { lat: 23.776635, lng: 90.427967 }, { lat: 23.776674, lng: 90.428246 },
  { lat: 23.776748, lng: 90.428482 }, { lat: 23.776887, lng: 90.428848 }, { lat: 23.776973, lng: 90.429121 },
  { lat: 23.777008, lng: 90.429278 }, { lat: 23.777081, lng: 90.429625 }, { lat: 23.777147, lng: 90.4298 },
  { lat: 23.777191, lng: 90.429979 }, { lat: 23.777213, lng: 90.430209 }, { lat: 23.777235, lng: 90.430493 },
  { lat: 23.777254, lng: 90.430753 }, { lat: 23.777239, lng: 90.430958 }, { lat: 23.777238, lng: 90.431223 },
  { lat: 23.77718, lng: 90.431535 }, { lat: 23.777181, lng: 90.432001 }, { lat: 23.776968, lng: 90.432049 },
  { lat: 23.776734, lng: 90.43211 }, { lat: 23.77648, lng: 90.432268 }, { lat: 23.776356, lng: 90.432346 },
  { lat: 23.776212, lng: 90.432408 }, { lat: 23.77581, lng: 90.432549 }, { lat: 23.775562, lng: 90.432622 },
  { lat: 23.775275, lng: 90.432713 }, { lat: 23.775096, lng: 90.432751 }, { lat: 23.774896, lng: 90.432803 },
  { lat: 23.774775, lng: 90.432892 }, { lat: 23.774575, lng: 90.433156 }, { lat: 23.774471, lng: 90.433298 },
  { lat: 23.774332, lng: 90.433317 }, { lat: 23.774074, lng: 90.433397 }, { lat: 23.773727, lng: 90.433532 },
  { lat: 23.773514, lng: 90.433634 }, { lat: 23.77323, lng: 90.43377 }, { lat: 23.772998, lng: 90.433774 },
  { lat: 23.773023, lng: 90.433938 }, { lat: 23.772795, lng: 90.434018 }, { lat: 23.772627, lng: 90.4341 },
  { lat: 23.772571, lng: 90.433934 }, { lat: 23.77251, lng: 90.433757 }, { lat: 23.772284, lng: 90.433793 },
  { lat: 23.772035, lng: 90.43379 }, { lat: 23.77205, lng: 90.43393 },
];
