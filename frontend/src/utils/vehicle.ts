const VEHICLE_EMOJIS = ["🚌", "🚗", "🚙", "🛻", "🚕", "🚐"];

let cached: string | null = null;

/**
 * Picked once per browser tab (cached in sessionStorage) so a viewer sees a
 * consistent vehicle across the map and decorative scenes for their whole
 * session, while a different session (or a fresh tab) may see a different
 * one -- purely a bit of visual variety, not a signal about the real bus.
 */
export function getSessionVehicleEmoji(): string {
  if (cached) return cached;

  const stored = sessionStorage.getItem("bts-vehicle-emoji");
  if (stored && VEHICLE_EMOJIS.includes(stored)) {
    cached = stored;
    return cached;
  }

  const picked = VEHICLE_EMOJIS[Math.floor(Math.random() * VEHICLE_EMOJIS.length)];
  sessionStorage.setItem("bts-vehicle-emoji", picked);
  cached = picked;
  return picked;
}
