import { Circle, MapContainer, Marker, Polyline, Tooltip, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { LatLng, LocationRecord, RouteStop } from "../types";

function emojiIcon(emoji: string, size: number): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:${size}px;line-height:1">${emoji}</span>`,
    className: "map-emoji-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const busIcon = emojiIcon("🚌", 30);
const riderIcon = emojiIcon("🧍", 22);
const stopIcon = emojiIcon("📍", 20);
const selfIcon = emojiIcon("🔵", 18);

interface MapViewProps {
  stops: RouteStop[];
  /** Dense, road-following points for the route line; falls back to straight lines between `stops` if omitted. */
  path?: LatLng[];
  drivers?: LocationRecord[];
  riders?: LocationRecord[];
  /** The viewer's own live position, shown regardless of whether they're within the route geofence. */
  self?: LatLng;
  /** Distance from `self` to the nearest point on the route, in meters -- drawn as a circle when set. */
  selfDistanceToRouteMeters?: number;
  height?: string;
}

export function MapView({
  stops,
  path,
  drivers = [],
  riders = [],
  self,
  selfDistanceToRouteMeters,
  height = "60vh",
}: MapViewProps) {
  const center: [number, number] = stops.length
    ? [stops[Math.floor(stops.length / 2)].lat, stops[Math.floor(stops.length / 2)].lng]
    : [23.78, 90.43];

  const linePositions = path && path.length > 1 ? path : stops;

  return (
    <div className="map-view" style={{ height }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {linePositions.length > 1 && (
          <Polyline
            positions={linePositions.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.6 }}
          />
        )}

        {stops.map((stop) => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Tooltip direction="top" offset={[0, -8]}>{stop.name}</Tooltip>
          </Marker>
        ))}

        {drivers.map((driver) => (
          <Marker key={driver.userId} position={[driver.lat, driver.lng]} icon={busIcon}>
            <Tooltip direction="top" offset={[0, -12]}>
              Bus &middot; {driver.employeeId}
              <br />
              Updated {new Date(driver.updatedAt).toLocaleTimeString()}
            </Tooltip>
          </Marker>
        ))}

        {riders.map((rider) => (
          <Marker key={rider.userId} position={[rider.lat, rider.lng]} icon={riderIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              Waiting &middot; {rider.employeeId}
              <br />
              Updated {new Date(rider.updatedAt).toLocaleTimeString()}
            </Tooltip>
          </Marker>
        ))}

        {self && selfDistanceToRouteMeters !== undefined && (
          <Circle
            center={[self.lat, self.lng]}
            radius={selfDistanceToRouteMeters}
            pathOptions={{ color: "#dc2626", weight: 2, dashArray: "6 6", fillOpacity: 0.05 }}
          />
        )}

        {self && (
          <Marker position={[self.lat, self.lng]} icon={selfIcon}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              You
              {selfDistanceToRouteMeters !== undefined && (
                <>
                  <br />
                  {Math.round(selfDistanceToRouteMeters)}m from route
                </>
              )}
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
