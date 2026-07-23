import { z } from "zod";

const employeeId = z
  .string()
  .trim()
  .min(3, "Employee ID must be at least 3 characters")
  .max(20, "Employee ID must be at most 20 characters")
  .regex(/^[A-Za-z0-9-]+$/, "Employee ID may only contain letters, numbers, and hyphens");

const role = z.enum(["engineer", "staff", "admin", "driver"]);

export const addEmployeeSchema = z.object({
  employeeId,
  role,
  note: z.string().trim().max(200).optional(),
});

export const updateEmployeeSchema = z.object({
  role,
  note: z.string().trim().max(200).optional(),
});

export type AddEmployeeInput = z.infer<typeof addEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
