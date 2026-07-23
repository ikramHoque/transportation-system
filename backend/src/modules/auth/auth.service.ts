import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { pool } from "../../db/pool";
import { HttpError } from "../../utils/httpError";
import { signToken } from "../../utils/jwt";
import { sessionEvents, SESSION_INVALIDATED_EVENT } from "../../realtime/sessionEvents";
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
  const sessionId = randomUUID();

  const inserted = await pool.query<UserRow>(
    `INSERT INTO users (employee_id, password_hash, role, session_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, employee_id, password_hash, role`,
    [input.employeeId, passwordHash, role, sessionId],
  );

  const user = toAuthenticatedUser(inserted.rows[0]);
  return { token: signToken(user, sessionId), user };
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

  // Rotating the session id invalidates any token issued by a previous
  // login (REST requests re-check it in requireAuth; already-connected
  // sockets are actively kicked via this event).
  const sessionId = randomUUID();
  await pool.query("UPDATE users SET session_id = $1 WHERE id = $2", [sessionId, row.id]);
  sessionEvents.emit(SESSION_INVALIDATED_EVENT, row.id);

  const user = toAuthenticatedUser(row);
  return { token: signToken(user, sessionId), user };
}

export async function isSessionActive(userId: string, sessionId: string): Promise<boolean> {
  const result = await pool.query<{ session_id: string }>("SELECT session_id FROM users WHERE id = $1", [
    userId,
  ]);
  return result.rowCount === 1 && result.rows[0].session_id === sessionId;
}
