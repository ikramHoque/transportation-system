import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { getDriversHandler, getSummaryHandler, getWaitingRidersHandler } from "./location.controller";

export const locationRouter = Router();

locationRouter.use(requireAuth);

// Any authenticated role can see the bus location.
locationRouter.get("/driver", asyncHandler(getDriversHandler));

// Only the driver and admins need the waiting-riders roster.
locationRouter.get("/waiting", requireRole("driver", "admin"), asyncHandler(getWaitingRidersHandler));

// Combined view for the admin dashboard.
locationRouter.get("/summary", requireRole("admin"), asyncHandler(getSummaryHandler));
