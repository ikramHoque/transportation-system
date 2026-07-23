import type { Request, Response } from "express";
import * as authService from "./auth.service";

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { token, user } = await authService.register(req.body);
  res.status(201).json({ token, user });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { token, user } = await authService.login(req.body);
  res.status(200).json({ token, user });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json({ user: req.user });
}
