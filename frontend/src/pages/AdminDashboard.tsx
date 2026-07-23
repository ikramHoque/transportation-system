import { useEffect, useState, type FormEvent } from "react";
import { MapView } from "../components/MapView";
import { StatCard } from "../components/StatCard";
import { useSocket } from "../context/SocketContext";
import { fetchSummary } from "../api/location";
import { fetchRouteStops } from "../api/route";
import { addAllowedEmployee, fetchAllowedEmployees, removeAllowedEmployee } from "../api/employees";
import { extractErrorMessage } from "../api/client";
import type { AllowedEmployee, LocationRecord, RouteStop, UserRole } from "../types";

const ROLE_OPTIONS: UserRole[] = ["engineer", "staff", "driver", "admin"];

export function AdminDashboard() {
  const socket = useSocket();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [drivers, setDrivers] = useState<LocationRecord[]>([]);
  const [riders, setRiders] = useState<LocationRecord[]>([]);
  const [employees, setEmployees] = useState<AllowedEmployee[]>([]);
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("engineer");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadEmployees() {
    setEmployees(await fetchAllowedEmployees());
  }

  useEffect(() => {
    fetchRouteStops().then(setStops).catch(() => {});
    fetchSummary()
      .then((res) => {
        setDrivers(res.drivers);
        setRiders(res.riders);
      })
      .catch(() => {});
    loadEmployees().catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    function handleDriverLocation(record: LocationRecord) {
      setDrivers((prev) => [...prev.filter((d) => d.userId !== record.userId), record]);
    }
    function handleWaitingUpdate(payload: { count: number; riders: LocationRecord[] }) {
      setRiders(payload.riders);
    }

    socket.on("driver:location", handleDriverLocation);
    socket.on("waiting:update", handleWaitingUpdate);
    return () => {
      socket.off("driver:location", handleDriverLocation);
      socket.off("waiting:update", handleWaitingUpdate);
    };
  }, [socket]);

  async function handleAddEmployee(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await addAllowedEmployee(newEmployeeId.trim(), newRole);
      setNewEmployeeId("");
      await loadEmployees();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(employeeId: string) {
    setFormError(null);
    try {
      await removeAllowedEmployee(employeeId);
      await loadEmployees();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>Admin overview</h2>
      </div>

      <div className="dashboard__stats">
        <StatCard label="Active buses" value={drivers.length} tone={drivers.length > 0 ? "success" : "warning"} />
        <StatCard label="Engineers waiting" value={riders.length} tone={riders.length > 0 ? "success" : "default"} />
      </div>

      <MapView stops={stops} drivers={drivers} riders={riders} />

      <section className="admin-panel">
        <h3>Employee whitelist</h3>
        <form className="inline-form" onSubmit={handleAddEmployee}>
          <input
            placeholder="Employee ID"
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            required
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            Add employee
          </button>
        </form>

        {formError && <div className="alert alert--error">{formError}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Role</th>
              <th>Registered</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.employee_id}</td>
                <td>{employee.role}</td>
                <td>{employee.is_registered ? "Yes" : "No"}</td>
                <td>
                  {!employee.is_registered && (
                    <button
                      className="btn btn--ghost btn--small"
                      onClick={() => handleRemove(employee.employee_id)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
