import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { clearStoredToken, getStoredToken, setStoredToken, setUnauthorizedHandler } from "../api/client";
import type { AuthenticatedUser } from "../types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  /** Set when the session ended involuntarily (e.g. logged in elsewhere) -- shown on the login page. */
  sessionMessage: string | null;
  login: (employeeId: string, password: string) => Promise<void>;
  register: (employeeId: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  clearSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    authApi
      .fetchMe()
      .then((me) => {
        setUser(me);
        setToken(stored);
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  function logout(reason?: string): void {
    clearStoredToken();
    setToken(null);
    setUser(null);
    if (reason) setSessionMessage(reason);
  }

  useEffect(() => {
    setUnauthorizedHandler((message) => logout(message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(employeeId: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authApi.login(employeeId, password);
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setSessionMessage(null);
  }

  async function register(employeeId: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authApi.register(employeeId, password);
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setSessionMessage(null);
  }

  function clearSessionMessage(): void {
    setSessionMessage(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, sessionMessage, login, register, logout, clearSessionMessage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
