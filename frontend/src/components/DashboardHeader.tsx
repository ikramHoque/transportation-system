import type { ReactNode } from "react";

interface DashboardHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  tone: "rider" | "driver" | "admin";
  actions?: ReactNode;
}

export function DashboardHeader({ icon, title, subtitle, tone, actions }: DashboardHeaderProps) {
  return (
    <div className={`page-header page-header--${tone}`}>
      <div className="page-header__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="page-header__text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
