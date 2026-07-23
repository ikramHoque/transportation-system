import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { addEmployeeSchema, updateEmployeeSchema } from "./employees.schemas";
import {
  addEmployeeHandler,
  listEmployeesHandler,
  removeEmployeeHandler,
  updateEmployeeHandler,
} from "./employees.controller";

export const employeesRouter = Router();

employeesRouter.use(requireAuth, requireRole("admin"));

employeesRouter.get("/", asyncHandler(listEmployeesHandler));
employeesRouter.post("/", validateBody(addEmployeeSchema), asyncHandler(addEmployeeHandler));
employeesRouter.patch("/:employeeId", validateBody(updateEmployeeSchema), asyncHandler(updateEmployeeHandler));
employeesRouter.delete("/:employeeId", asyncHandler(removeEmployeeHandler));
