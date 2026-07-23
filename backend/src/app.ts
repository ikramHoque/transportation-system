import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { employeesRouter } from "./modules/employees/employees.routes";
import { locationRouter } from "./modules/location/location.routes";
import { routeRouter } from "./modules/route/route.routes";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "10kb" }));
  app.use(apiRateLimiter);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin/employees", employeesRouter);
  app.use("/api/location", locationRouter);
  app.use("/api/route", routeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
