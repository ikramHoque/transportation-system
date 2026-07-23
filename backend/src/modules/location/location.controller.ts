import type { Request, Response } from "express";
import * as locationService from "./location.service";

export async function getDriversHandler(_req: Request, res: Response): Promise<void> {
  const drivers = await locationService.getActiveDrivers();
  res.status(200).json({ drivers });
}

export async function getWaitingRidersHandler(_req: Request, res: Response): Promise<void> {
  const riders = await locationService.getWaitingRiders();
  res.status(200).json({ count: riders.length, riders });
}

export async function getSummaryHandler(_req: Request, res: Response): Promise<void> {
  const [drivers, riders] = await Promise.all([
    locationService.getActiveDrivers(),
    locationService.getWaitingRiders(),
  ]);
  res.status(200).json({ drivers, riders, waitingCount: riders.length });
}
