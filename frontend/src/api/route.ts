import { apiClient } from "./client";
import type { LatLng, RouteStop } from "../types";

export interface RouteData {
  stops: RouteStop[];
  path: LatLng[];
}

export async function fetchRoute(): Promise<RouteData> {
  const { data } = await apiClient.get<RouteData>("/route/stops");
  return data;
}
