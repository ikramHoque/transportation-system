const VEHICLE_EMOJIS = ["🚌", "🚗", "🚙", "🛻", "🚕", "🚐"];

let cachedVehicle: string | null = null;
let cachedFleet: string[] | null = null;

/**
 * Picked once per browser tab (cached in sessionStorage) so a viewer sees a
 * consistent vehicle across the map and decorative scenes for their whole
 * session, while a different session (or a fresh tab) may see a different
 * one -- purely a bit of visual variety, not a signal about the real bus.
 */
export function getSessionVehicleEmoji(): string {
  if (cachedVehicle) return cachedVehicle;

  const stored = sessionStorage.getItem("bts-vehicle-emoji");
  if (stored && VEHICLE_EMOJIS.includes(stored)) {
    cachedVehicle = stored;
    return cachedVehicle;
  }

  const picked = VEHICLE_EMOJIS[Math.floor(Math.random() * VEHICLE_EMOJIS.length)];
  sessionStorage.setItem("bts-vehicle-emoji", picked);
  cachedVehicle = picked;
  return picked;
}

/**
 * `size` distinct vehicle emojis, picked once per browser tab, for
 * decorative multi-vehicle scenes (e.g. the route strip's little fleet).
 */
export function getSessionVehicleFleet(size: number): string[] {
  if (cachedFleet && cachedFleet.length === size) return cachedFleet;

  const stored = sessionStorage.getItem("bts-vehicle-fleet");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === size && parsed.every((v) => VEHICLE_EMOJIS.includes(v))) {
        cachedFleet = parsed;
        return cachedFleet;
      }
    } catch {
      // Corrupt/old value -- fall through and pick a fresh fleet.
    }
  }

  const shuffled = [...VEHICLE_EMOJIS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, size);
  sessionStorage.setItem("bts-vehicle-fleet", JSON.stringify(picked));
  cachedFleet = picked;
  return picked;
}
