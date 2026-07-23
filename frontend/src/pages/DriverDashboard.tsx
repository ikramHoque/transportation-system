import { useEffect, useState } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { MapView } from "../components/MapView";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { fetchWaitingRiders } from "../api/location";
import { fetchRoute } from "../api/route";
import type { LatLng, LocationRecord, RouteStop } from "../types";

export function DriverDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [path, setPath] = useState<LatLng[]>([]);
  const [riders, setRiders] = useState<LocationRecord[]>([]);

  const { position, error: geoError } = useGeolocation({ enabled: true, intervalMs: 5000 });

  useEffect(() => {
    fetchRoute()
      .then((route) => {
        setStops(route.stops);
        setPath(route.path);
      })
      .catch(() => {});
    fetchWaitingRiders()
      .then((res) => setRiders(res.riders))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    function handleWaitingUpdate(payload: { count: number; riders: LocationRecord[] }) {
      setRiders(payload.riders);
    }

    socket.on("waiting:update", handleWaitingUpdate);
    return () => {
      socket.off("waiting:update", handleWaitingUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !position) return;
    socket.emit("location:update", { lat: position.lat, lng: position.lng });
  }, [socket, position]);

  const driverMarker: LocationRecord[] =
    position && user
      ? [
          {
            userId: user.id,
            employeeId: user.employeeId,
            role: "driver",
            lat: position.lat,
            lng: position.lng,
            isWaiting: true,
            updatedAt: new Date().toISOString(),
          },
        ]
      : [];

  return (
    <div className="dashboard">
      <DashboardHeader
        icon="🚌"
        tone="driver"
        title={`On the road -- ${user?.employeeId}`}
        subtitle="Your location is shared live with waiting engineers and admin"
      />

      {geoError && <div className="alert alert--error">Location error: {geoError}</div>}
      {!position && !geoError && <div className="alert alert--info">Getting your location...</div>}

      <div className="dashboard__stats">
        <StatCard
          icon="🧍"
          label="Engineers waiting"
          value={riders.length}
          tone={riders.length > 0 ? "success" : "default"}
        />
        <StatCard
          icon="📡"
          label="Your sharing status"
          value={position ? "Live" : "Waiting for GPS"}
          live={Boolean(position)}
        />
      </div>

      <MapView stops={stops} path={path} drivers={driverMarker} riders={riders} />

      <div className="rider-list">
        <h3>Waiting list</h3>
        {riders.length === 0 ? (
          <p className="muted">No one is currently waiting.</p>
        ) : (
          <ul className="waiting-list">
            {riders.map((rider) => (
              <li key={rider.userId} className="waiting-card">
                <span className="waiting-card__avatar anim-bounce" aria-hidden="true">
                  🧍
                </span>
                <div className="waiting-card__body">
                  <span className="waiting-card__id">{rider.employeeId}</span>
                  <span className="waiting-card__time">
                    Updated {new Date(rider.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
