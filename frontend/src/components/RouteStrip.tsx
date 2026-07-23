/**
 * A slim ambient strip shown below the navbar on every authenticated page:
 * a bus drives past a few waiting riders on a loop. Purely decorative --
 * carries the shuttle theme from the login page into the dashboard instead
 * of it stopping at the login form.
 */
export function RouteStrip() {
  return (
    <div className="route-strip" aria-hidden="true">
      <div className="route-strip__road" />
      <span className="route-strip__stop route-strip__stop--1">🧍</span>
      <span className="route-strip__stop route-strip__stop--2">🧍</span>
      <span className="route-strip__stop route-strip__stop--3">🧍</span>
      <span className="route-strip__stop route-strip__stop--4">🧍</span>
      <span className="route-strip__bus">🚌</span>
    </div>
  );
}
