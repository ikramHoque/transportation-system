import { pool } from "../../db/pool";
import { HttpError } from "../../utils/httpError";
import type { UserRole } from "../../types";
import type { AddEmployeeInput, UpdateEmployeeInput } from "./employees.schemas";

export interface AllowedEmployeeRow {
  employee_id: string;
  role: UserRole;
  note: string | null;
  created_at: string;
  is_registered: boolean;
}

export async function listEmployees(): Promise<AllowedEmployeeRow[]> {
  const result = await pool.query<AllowedEmployeeRow>(`
    SELECT
      ae.employee_id,
      ae.role,
      ae.note,
      ae.created_at,
      (u.id IS NOT NULL) AS is_registered
    FROM allowed_employees ae
    LEFT JOIN users u ON u.employee_id = ae.employee_id
    ORDER BY ae.created_at DESC
  `);
  return result.rows;
}

export async function addEmployee(input: AddEmployeeInput): Promise<AllowedEmployeeRow> {
  const existing = await pool.query("SELECT 1 FROM allowed_employees WHERE employee_id = $1", [
    input.employeeId,
  ]);
  if ((existing.rowCount ?? 0) > 0) {
    throw new HttpError(409, "This employee ID is already on the whitelist");
  }

  const result = await pool.query<AllowedEmployeeRow>(
    `INSERT INTO allowed_employees (employee_id, role, note)
     VALUES ($1, $2, $3)
     RETURNING employee_id, role, note, created_at, false AS is_registered`,
    [input.employeeId, input.role, input.note ?? null],
  );
  return result.rows[0];
}

/** Updates the whitelisted role/note, and keeps an already-registered user's role in sync. */
export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<AllowedEmployeeRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await client.query<AllowedEmployeeRow>(
      `UPDATE allowed_employees SET role = $2, note = $3 WHERE employee_id = $1
       RETURNING employee_id, role, note, created_at`,
      [employeeId, input.role, input.note ?? null],
    );
    if (updated.rowCount === 0) {
      throw new HttpError(404, "Employee ID not found on the whitelist");
    }

    const userUpdate = await client.query("UPDATE users SET role = $2 WHERE employee_id = $1 RETURNING id", [
      employeeId,
      input.role,
    ]);

    await client.query("COMMIT");
    return { ...updated.rows[0], is_registered: (userUpdate.rowCount ?? 0) > 0 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function removeEmployee(employeeId: string): Promise<void> {
  const registered = await pool.query("SELECT 1 FROM users WHERE employee_id = $1", [employeeId]);
  if ((registered.rowCount ?? 0) > 0) {
    throw new HttpError(409, "Cannot remove an employee ID that has already registered an account");
  }

  const result = await pool.query("DELETE FROM allowed_employees WHERE employee_id = $1", [employeeId]);
  if (result.rowCount === 0) {
    throw new HttpError(404, "Employee ID not found on the whitelist");
  }
}
