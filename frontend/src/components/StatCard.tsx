interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}
