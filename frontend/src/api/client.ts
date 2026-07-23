import axios from "axios";

const TOKEN_STORAGE_KEY = "bts_token";

export const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints reachable without an active session -- a 401 from these means
// "wrong credentials", not "your session was invalidated", so they must
// never trigger the global logout below.
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register"];

type UnauthorizedHandler = (message: string) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered once by AuthContext so a 401 from any authenticated call can force a client-side logout. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
    const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

    if (axios.isAxiosError(error) && error.response?.status === 401 && !isPublicAuthCall) {
      const message =
        typeof error.response.data?.error === "string"
          ? error.response.data.error
          : "Your session ended. Please log in again.";
      unauthorizedHandler?.(message);
    }
    return Promise.reject(error);
  },
);

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") {
    return err.response.data.error;
  }
  return "Something went wrong. Please try again.";
}
