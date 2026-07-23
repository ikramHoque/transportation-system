import type { Request, Response } from "express";
import * as employeesService from "./employees.service";

export async function listEmployeesHandler(_req: Request, res: Response): Promise<void> {
  const employees = await employeesService.listEmployees();
  res.status(200).json({ employees });
}

export async function addEmployeeHandler(req: Request, res: Response): Promise<void> {
  const employee = await employeesService.addEmployee(req.body);
  res.status(201).json({ employee });
}

export async function updateEmployeeHandler(req: Request, res: Response): Promise<void> {
  const employee = await employeesService.updateEmployee(req.params.employeeId, req.body);
  res.status(200).json({ employee });
}

export async function removeEmployeeHandler(req: Request, res: Response): Promise<void> {
  await employeesService.removeEmployee(req.params.employeeId);
  res.status(204).send();
}
