import { useEffect, useRef, useState } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
}

interface UseGeolocationOptions {
  enabled: boolean;
  /** Minimum time between reported position updates, in ms. */
  intervalMs?: number;
}

interface UseGeolocationResult {
  position: GeoPosition | null;
  error: string | null;
}

export function useGeolocation({ enabled, intervalMs = 5000 }: UseGeolocationOptions): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastEmitRef.current < intervalMs) return;
        lastEmitRef.current = now;
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, intervalMs]);

  return { position, error };
}
