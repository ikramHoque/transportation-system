import { useCallback, useEffect, useState } from "react";
import { MapView } from "../components/MapView";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { fetchDriverLocations } from "../api/location";
import { fetchRoute } from "../api/route";
import type { LatLng, LocationRecord, RouteStop } from "../types";

export function RiderDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [path, setPath] = useState<LatLng[]>([]);
  const [drivers, setDrivers] = useState<LocationRecord[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [outOfRangeMessage, setOutOfRangeMessage] = useState<string | null>(null);
  const [pickedUpMessage, setPickedUpMessage] = useState<string | null>(null);

  const { position, error: geoError } = useGeolocation({ enabled: isWaiting, intervalMs: 20000 });

  useEffect(() => {
    fetchRoute()
      .then((route) => {
        setStops(route.stops);
        setPath(route.path);
      })
      .catch(() => {});
    fetchDriverLocations().then(setDrivers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    function handleDriverLocation(record: LocationRecord) {
      setDrivers((prev) => [...prev.filter((d) => d.userId !== record.userId), record]);
    }
    function handleOutOfRange(payload: { message: string }) {
      setOutOfRangeMessage(payload.message);
    }
    function handlePickedUp(payload: { message: string }) {
      setPickedUpMessage(payload.message);
      // The server already stopped counting us as waiting; reflect that
      // locally so the button doesn't keep claiming "waiting" is still on.
      setIsWaiting(false);
    }

    socket.on("driver:location", handleDriverLocation);
    socket.on("location:outOfRange", handleOutOfRange);
    socket.on("location:pickedUp", handlePickedUp);
    return () => {
      socket.off("driver:location", handleDriverLocation);
      socket.off("location:outOfRange", handleOutOfRange);
      socket.off("location:pickedUp", handlePickedUp);
    };
  }, [socket]);

  // Re-emits whenever the waiting toggle flips (immediately signaling "no longer
  // waiting" using the last known fix) or whenever a fresh position comes in.
  useEffect(() => {
    if (!socket || !position) return;
    setOutOfRangeMessage(null);
    socket.emit("location:update", { lat: position.lat, lng: position.lng, isWaiting });
  }, [socket, position, isWaiting]);

  const handleToggle = useCallback(() => {
    setOutOfRangeMessage(null);
    setPickedUpMessage(null);
    setIsWaiting((prev) => !prev);
  }, []);

  const latestDriver = drivers[0];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>Hi, {user?.employeeId}</h2>
        <button className={`btn ${isWaiting ? "btn--danger" : "btn--primary"}`} onClick={handleToggle}>
          {isWaiting ? "Stop waiting" : "I'm waiting for the bus"}
        </button>
      </div>

      {geoError && <div className="alert alert--error">Location error: {geoError}</div>}
      {isWaiting && !position && !geoError && (
        <div className="alert alert--info">Getting your location...</div>
      )}
      {isWaiting && outOfRangeMessage && <div className="alert alert--error">{outOfRangeMessage}</div>}
      {pickedUpMessage && <div className="alert alert--info">{pickedUpMessage}</div>}

      <div className="dashboard__stats">
        <StatCard
          label="Bus status"
          value={latestDriver ? "On the road" : "No live location yet"}
          tone={latestDriver ? "success" : "warning"}
        />
        {latestDriver && (
          <StatCard label="Last updated" value={new Date(latestDriver.updatedAt).toLocaleTimeString()} />
        )}
      </div>

      <MapView stops={stops} path={path} drivers={drivers} />
    </div>
  );
}
