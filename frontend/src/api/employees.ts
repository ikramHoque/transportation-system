import { apiClient } from "./client";
import type { AllowedEmployee, UserRole } from "../types";

export async function fetchAllowedEmployees(): Promise<AllowedEmployee[]> {
  const { data } = await apiClient.get<{ employees: AllowedEmployee[] }>("/admin/employees");
  return data.employees;
}

export async function addAllowedEmployee(
  employeeId: string,
  role: UserRole,
  note?: string,
): Promise<AllowedEmployee> {
  const { data } = await apiClient.post<{ employee: AllowedEmployee }>("/admin/employees", {
    employeeId,
    role,
    note,
  });
  return data.employee;
}

export async function removeAllowedEmployee(employeeId: string): Promise<void> {
  await apiClient.delete(`/admin/employees/${employeeId}`);
}
