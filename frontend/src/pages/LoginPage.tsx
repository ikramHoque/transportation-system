import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

export function LoginPage() {
  const { login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(employeeId, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>BJIT Transportation</h1>
        <p className="auth-card__subtitle">Notunbazar &harr; Satarkul shuttle tracker</p>

        {sessionMessage && <div className="alert alert--info">{sessionMessage}</div>}

        <label>
          Employee ID
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. ENG-001"
            required
            autoFocus
          />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="alert alert--error">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="auth-card__footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
