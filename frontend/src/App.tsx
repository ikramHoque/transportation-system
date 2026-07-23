import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RiderDashboard } from "./pages/RiderDashboard";
import { DriverDashboard } from "./pages/DriverDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { NotFoundPage } from "./pages/NotFoundPage";

function RoleHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="centered">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "driver") return <Navigate to="/driver" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/rider" replace />;
}

/** Wraps the authenticated app (Navbar + padded content); login/register render outside this so their full-bleed scene isn't constrained by app-content's padding. */
function AppLayout() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<RoleHome />} />

        <Route element={<ProtectedRoute allowedRoles={["engineer", "staff"]} />}>
          <Route path="/rider" element={<RiderDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver" element={<DriverDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
