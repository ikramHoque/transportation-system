import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/** Animated shuttle-route scene behind the login/register card. Bus and rider are drawn as simple colored-block shapes (not the LEGO Group's trademarked minifigure/brick design). */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-scene">
      <div className="auth-scene__sky">
        <div className="auth-scene__cloud auth-scene__cloud--1" />
        <div className="auth-scene__cloud auth-scene__cloud--2" />
        <div className="auth-scene__cloud auth-scene__cloud--3" />
      </div>

      <div className="auth-scene__stop">
        <svg viewBox="0 0 40 90" className="auth-scene__sign" aria-hidden="true">
          <rect x="17" y="18" width="6" height="60" rx="2" fill="#8a8f98" />
          <rect x="2" y="2" width="36" height="24" rx="4" fill="#2563eb" />
          <text x="20" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
            BUS
          </text>
        </svg>

        <svg viewBox="0 0 60 92" className="auth-scene__avatar" aria-hidden="true">
          <ellipse cx="30" cy="88" rx="16" ry="4" fill="#00000022" />
          <g className="auth-scene__avatar-arm-back">
            <rect x="8" y="40" width="9" height="28" rx="4" fill="#f4a300" />
          </g>
          <rect x="16" y="34" width="28" height="36" rx="8" fill="#ef476f" />
          <rect x="18" y="66" width="10" height="22" rx="4" fill="#3b3f45" />
          <rect x="32" y="66" width="10" height="22" rx="4" fill="#3b3f45" />
          <g className="auth-scene__avatar-arm-front">
            <rect x="43" y="38" width="9" height="26" rx="4" fill="#f4a300" />
          </g>
          <circle cx="30" cy="20" r="15" fill="#ffd166" />
          <circle cx="24" cy="19" r="2.2" fill="#3b3f45" />
          <circle cx="36" cy="19" r="2.2" fill="#3b3f45" />
          <path d="M23 26 Q30 31 37 26" stroke="#3b3f45" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="16" y="6" width="28" height="10" rx="5" fill="#383691" />
        </svg>
      </div>

      <div className="auth-scene__road">
        <div className="auth-scene__road-surface" />

        <svg viewBox="0 0 220 110" className="auth-scene__bus" aria-hidden="true">
          <rect x="6" y="20" width="190" height="60" rx="14" fill="#ffd166" />
          <rect x="6" y="20" width="190" height="18" rx="9" fill="#f4a300" />
          <rect x="20" y="42" width="30" height="24" rx="4" fill="#cdeaff" />
          <rect x="58" y="42" width="30" height="24" rx="4" fill="#cdeaff" />
          <rect x="96" y="42" width="30" height="24" rx="4" fill="#cdeaff" />
          <rect x="134" y="42" width="30" height="24" rx="4" fill="#cdeaff" />
          <rect x="160" y="46" width="30" height="34" rx="4" fill="#383691" />
          <rect x="6" y="72" width="190" height="10" fill="#e2e2e2" />
          <text x="101" y="34" textAnchor="middle" fontSize="14" fontWeight="700" fill="#383691">
            BJIT SHUTTLE
          </text>
          <g className="auth-scene__wheel" style={{ transformOrigin: "45px 88px" }}>
            <circle cx="45" cy="88" r="14" fill="#2b2f36" />
            <circle cx="45" cy="88" r="5" fill="#c9ccd1" />
          </g>
          <g className="auth-scene__wheel" style={{ transformOrigin: "160px 88px" }}>
            <circle cx="160" cy="88" r="14" fill="#2b2f36" />
            <circle cx="160" cy="88" r="5" fill="#c9ccd1" />
          </g>
        </svg>
      </div>

      <div className="auth-scene__content">{children}</div>
    </div>
  );
}
