const EARTH_RADIUS_METERS = 6371000;

export interface LatLng {
  lat: number;
  lng: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Projects lat/lng to local planar meters (equirectangular approximation).
 * Accurate enough for the few-kilometer distances involved in geofencing a
 * fixed shuttle route -- not suitable for long-range distance calculations.
 */
function project(point: LatLng, origin: LatLng): { x: number; y: number } {
  const latRad = toRadians(origin.lat);
  return {
    x: toRadians(point.lng - origin.lng) * Math.cos(latRad) * EARTH_RADIUS_METERS,
    y: toRadians(point.lat - origin.lat) * EARTH_RADIUS_METERS,
  };
}

function distancePointToSegmentMeters(point: LatLng, a: LatLng, b: LatLng): number {
  const origin = a;
  const p = project(point, origin);
  const pb = project(b, origin);

  const dx = pb.x;
  const dy = pb.y;
  const lengthSquared = dx * dx + dy * dy;

  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (p.x * dx + p.y * dy) / lengthSquared));

  const closestX = t * dx;
  const closestY = t * dy;
  const ddx = p.x - closestX;
  const ddy = p.y - closestY;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

/** Shortest distance in meters from `point` to the polyline connecting `path`, in order. */
export function distanceToPathMeters(point: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) {
    const p = project(point, path[0]);
    return Math.sqrt(p.x * p.x + p.y * p.y);
  }

  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const distance = distancePointToSegmentMeters(point, path[i], path[i + 1]);
    if (distance < min) min = distance;
  }
  return min;
}

/** Straight-line distance in meters between two points. */
export function distanceBetweenPointsMeters(a: LatLng, b: LatLng): number {
  return distanceToPathMeters(a, [b]);
}
