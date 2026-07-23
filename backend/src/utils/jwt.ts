import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthenticatedUser, JwtPayload } from "../types";

export function signToken(user: AuthenticatedUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    employeeId: user.employeeId,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
