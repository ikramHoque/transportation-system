import { apiClient } from "./client";
import type { RouteStop } from "../types";

export async function fetchRouteStops(): Promise<RouteStop[]> {
  const { data } = await apiClient.get<{ stops: RouteStop[] }>("/route/stops");
  return data.stops;
}
