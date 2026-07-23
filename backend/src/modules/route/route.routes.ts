import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { ROUTE_STOPS } from "../../config/route";

export const routeRouter = Router();

routeRouter.get("/stops", requireAuth, (_req, res) => {
  res.status(200).json({ stops: ROUTE_STOPS });
});
