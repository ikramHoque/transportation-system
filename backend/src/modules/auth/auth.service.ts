import bcrypt from "bcryptjs";
import { pool } from "../../db/pool";
import { HttpError } from "../../utils/httpError";
import { signToken } from "../../utils/jwt";
import type { AuthenticatedUser, UserRole } from "../../types";
import type { LoginInput, RegisterInput } from "./auth.schemas";

const SALT_ROUNDS = 12;

interface UserRow {
  id: string;
  employee_id: string;
  password_hash: string;
  role: UserRole;
}

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return { id: row.id, employeeId: row.employee_id, role: row.role };
}

export async function register(input: RegisterInput): Promise<{ token: string; user: AuthenticatedUser }> {
  const allowed = await pool.query<{ role: UserRole }>(
    "SELECT role FROM allowed_employees WHERE employee_id = $1",
    [input.employeeId],
  );
  if (allowed.rowCount === 0) {
    throw new HttpError(403, "Employee ID not recognized. Contact your admin.");
  }

  const existing = await pool.query("SELECT 1 FROM users WHERE employee_id = $1", [input.employeeId]);
  if ((existing.rowCount ?? 0) > 0) {
    throw new HttpError(409, "This employee ID is already registered. Please login instead.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const role = allowed.rows[0].role;

  const inserted = await pool.query<UserRow>(
    `INSERT INTO users (employee_id, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, employee_id, password_hash, role`,
    [input.employeeId, passwordHash, role],
  );

  const user = toAuthenticatedUser(inserted.rows[0]);
  return { token: signToken(user), user };
}

export async function login(input: LoginInput): Promise<{ token: string; user: AuthenticatedUser }> {
  const result = await pool.query<UserRow>(
    "SELECT id, employee_id, password_hash, role FROM users WHERE employee_id = $1",
    [input.employeeId],
  );
  if (result.rowCount === 0) {
    throw new HttpError(401, "Invalid employee ID or password");
  }

  const row = result.rows[0];
  const passwordMatches = await bcrypt.compare(input.password, row.password_hash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid employee ID or password");
  }

  const user = toAuthenticatedUser(row);
  return { token: signToken(user), user };
}
