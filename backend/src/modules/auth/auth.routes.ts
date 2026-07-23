import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { authRateLimiter } from "../../middleware/rateLimit";
import { loginSchema, registerSchema } from "./auth.schemas";
import { loginHandler, meHandler, registerHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post("/login", authRateLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.get("/me", requireAuth, asyncHandler(meHandler));
