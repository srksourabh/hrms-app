import { DashboardShell } from "~/components/dashboard-shell";
import { AttendancePunchForm } from "~/components/hr/attendance-punch-form";
import { PageTitle } from "~/components/hr/ui";
import { getAttendance, getEmployees, getSessionUser, punchAttendance, tenantIdFor } from "~/lib/hr-direct";

export default async function AttendancePortalPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [employees, attendance] = await Promise.all([getEmployees(tenantId), getAttendance(tenantId)]);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Attendance" title="Attendance portal" description="HR can punch employees in or out and track the workplace location." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <AttendancePunchForm
          action={punchAttendance}
          employees={employees.map((employee) => ({ id: employee.id, label: `${employee.employeeCode} - ${employee.fullName}` }))}
        />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Recent attendance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="border-b py-2">Employee</th><th className="border-b py-2">Date</th><th className="border-b py-2">In</th><th className="border-b py-2">Out</th><th className="border-b py-2">In location</th><th className="border-b py-2">Out location</th><th className="border-b py-2">Minutes</th><th className="border-b py-2">Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-100 py-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="border-b border-slate-100 py-3">{row.workDate}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchOutAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInLocation ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchOutLocation ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.totalMinutes}</td>
                  <td className="border-b border-slate-100 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
