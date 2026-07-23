import { apiClient } from "./client";
import type { AuthenticatedUser } from "../types";

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
}

export async function login(employeeId: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { employeeId, password });
  return data;
}

export async function register(employeeId: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", { employeeId, password });
  return data;
}

export async function fetchMe(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<{ user: AuthenticatedUser }>("/auth/me");
  return data.user;
}
