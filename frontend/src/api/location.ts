import { apiClient } from "./client";
import type { LocationRecord } from "../types";

export async function fetchDriverLocations(): Promise<LocationRecord[]> {
  const { data } = await apiClient.get<{ drivers: LocationRecord[] }>("/location/driver");
  return data.drivers;
}

export async function fetchWaitingRiders(): Promise<{ count: number; riders: LocationRecord[] }> {
  const { data } = await apiClient.get<{ count: number; riders: LocationRecord[] }>("/location/waiting");
  return data;
}

export async function fetchSummary(): Promise<{
  drivers: LocationRecord[];
  riders: LocationRecord[];
  waitingCount: number;
}> {
  const { data } = await apiClient.get("/location/summary");
  return data;
}
