import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";
import { isSessionActive } from "../modules/auth/auth.service";
import type { JwtPayload } from "../types";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length);

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }

    const active = await isSessionActive(payload.sub, payload.sid);
    if (!active) {
      throw new HttpError(401, "Your session ended because this account signed in on another device.");
    }

    req.user = { id: payload.sub, employeeId: payload.employeeId, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}
