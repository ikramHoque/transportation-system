import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar__brand">BJIT Transportation</div>
      <div className="navbar__user">
        <span className="badge">{user.role}</span>
        <span>{user.employeeId}</span>
        <button onClick={logout} className="btn btn--ghost btn--small">
          Logout
        </button>
      </div>
    </header>
  );
}
