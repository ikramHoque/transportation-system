import { z } from "zod";

const employeeId = z
  .string()
  .trim()
  .min(3, "Employee ID must be at least 3 characters")
  .max(20, "Employee ID must be at most 20 characters")
  .regex(/^[A-Za-z0-9-]+$/, "Employee ID may only contain letters, numbers, and hyphens");

const password = z.string().min(6, "Password must be at least 6 characters").max(100);

export const registerSchema = z.object({
  employeeId,
  password,
});

export const loginSchema = z.object({
  employeeId,
  password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
