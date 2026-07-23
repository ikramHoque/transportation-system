interface StatCardProps {
  icon?: string;
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
  /** Shows a small pulsing dot next to the value, for real-time statuses. */
  live?: boolean;
}

export function StatCard({ icon, label, value, tone = "default", live = false }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      {icon && (
        <div className="stat-card__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div>
        <div className="stat-card__value">
          {value}
          {live && <span className="live-dot" aria-hidden="true" />}
        </div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}
