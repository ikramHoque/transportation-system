import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import type { UserRole } from "../types";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "Insufficient permissions");
    }
    next();
  };
}
