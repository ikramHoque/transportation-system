import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { clearStoredToken, getStoredToken, setStoredToken } from "../api/client";
import type { AuthenticatedUser } from "../types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<void>;
  register: (employeeId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  async function login(employeeId: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authApi.login(employeeId, password);
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function register(employeeId: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authApi.register(employeeId, password);
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout(): void {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
