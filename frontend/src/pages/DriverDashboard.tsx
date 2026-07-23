import { useEffect, useState } from "react";
import { MapView } from "../components/MapView";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { fetchWaitingRiders } from "../api/location";
import { fetchRouteStops } from "../api/route";
import type { LocationRecord, RouteStop } from "../types";

export function DriverDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [riders, setRiders] = useState<LocationRecord[]>([]);

  const { position, error: geoError } = useGeolocation({ enabled: true, intervalMs: 5000 });

  useEffect(() => {
    fetchRouteStops().then(setStops).catch(() => {});
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
      <div className="dashboard__header">
        <h2>Driver: {user?.employeeId}</h2>
      </div>

      {geoError && <div className="alert alert--error">Location error: {geoError}</div>}
      {!position && !geoError && <div className="alert alert--info">Getting your location...</div>}

      <div className="dashboard__stats">
        <StatCard
          label="Engineers waiting"
          value={riders.length}
          tone={riders.length > 0 ? "success" : "default"}
        />
        <StatCard label="Your sharing status" value={position ? "Live" : "Waiting for GPS"} />
      </div>

      <MapView stops={stops} drivers={driverMarker} riders={riders} />

      <div className="rider-list">
        <h3>Waiting list</h3>
        {riders.length === 0 ? (
          <p className="muted">No one is currently waiting.</p>
        ) : (
          <ul>
            {riders.map((rider) => (
              <li key={rider.userId}>
                {rider.employeeId} &middot; updated {new Date(rider.updatedAt).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
