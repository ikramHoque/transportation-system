-- Demo whitelist so the app is usable immediately after `docker compose up`.
-- Replace/remove these and add real company employee IDs via the
-- POST /api/admin/employees endpoint (admin role required) before real use.
INSERT INTO allowed_employees (employee_id, role, note) VALUES
  ('ADMIN-001', 'admin', 'Demo admin account'),
  ('DRIVER-001', 'driver', 'Demo driver account'),
  ('ENG-001', 'engineer', 'Demo engineer account'),
  ('STAFF-001', 'staff', 'Demo staff account')
ON CONFLICT (employee_id) DO NOTHING;
