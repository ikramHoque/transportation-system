-- Roles allowed in the system.
CREATE TYPE user_role AS ENUM ('engineer', 'staff', 'admin', 'driver');

-- Whitelist of valid company employee IDs and the role they are provisioned
-- for. Registration is only allowed for employee IDs that exist here.
-- Managed by admins via the /api/admin/employees endpoints.
CREATE TABLE allowed_employees (
  employee_id TEXT PRIMARY KEY,
  role user_role NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered accounts. No name is collected by design -- employee_id is the
-- only identifier. Role is copied from allowed_employees at registration
-- time for fast auth checks; kept in sync when an admin updates a role.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE REFERENCES allowed_employees(employee_id),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latest known location per user (current-state table, not a history log).
-- is_waiting is only meaningful for engineer/staff riders; drivers are
-- always considered "active" while their row is fresh.
CREATE TABLE locations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  role user_role NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_waiting BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX locations_role_idx ON locations (role);
CREATE INDEX locations_waiting_idx ON locations (role, is_waiting);
