import { getSessionVehicleFleet } from "../utils/vehicle";

const FLEET = getSessionVehicleFleet(3);

/**
 * A slim ambient strip shown below the navbar on every authenticated page:
 * a small fleet of vehicles drives past a few waiting riders, each one
 * pausing briefly at every stop (as if picking someone up) before moving
 * on. Purely decorative -- carries the shuttle theme from the login page
 * into the dashboard instead of it stopping at the login form.
 */
export function RouteStrip() {
  return (
    <div className="route-strip" aria-hidden="true">
      <div className="route-strip__road" />
      <span className="route-strip__stop route-strip__stop--1 anim-bounce">🧍</span>
      <span className="route-strip__stop route-strip__stop--2 anim-bounce">🧍</span>
      <span className="route-strip__stop route-strip__stop--3 anim-bounce">🧍</span>
      <span className="route-strip__stop route-strip__stop--4 anim-bounce">🧍</span>
      {FLEET.map((emoji, i) => (
        <span key={i} className={`route-strip__vehicle route-strip__vehicle--${i + 1}`}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
