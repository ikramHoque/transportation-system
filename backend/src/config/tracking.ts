/**
 * Auto-pickup detection tuning. With multiple shuttles serving the same
 * route, a rider who boards one bus but never presses "Stop waiting" would
 * otherwise keep showing up as waiting -- moving along with the bus -- to
 * every other driver and admin. Instead: once a rider's reported position
 * stays within PICKUP_RADIUS_METERS of any active driver for at least
 * PICKUP_DWELL_SECONDS, the server treats them as boarded and force-clears
 * their waiting flag itself, independent of what their client requests.
 *
 * Radius is intentionally generous to tolerate independent GPS jitter
 * between the rider's and driver's devices (dense urban multipath in
 * Dhaka can easily be 10-20m per device); dwell time guards against a
 * momentary pass-by (e.g. a red light near a stop) being mistaken for a
 * pickup.
 */
export const PICKUP_RADIUS_METERS = 40;
export const PICKUP_DWELL_SECONDS = 15;
