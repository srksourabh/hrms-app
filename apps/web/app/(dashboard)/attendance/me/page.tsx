import { DashboardShell } from "~/components/dashboard-shell";
import { AttendancePunchForm } from "~/components/hr/attendance-punch-form";
import { PageTitle } from "~/components/hr/ui";
import { getAttendance, getSessionUser, punchAttendance, tenantIdFor } from "~/lib/hr-direct";

export default async function MyAttendancePage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const attendance = await getAttendance(tenantId, user.employeeId);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Attendance" title="Punch in / punch out" description="Location fields are saved with every punch so HR can verify where attendance was recorded." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <AttendancePunchForm action={punchAttendance} employeeId={user.employeeId ?? ""} />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">My attendance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="border-b py-2">Date</th><th className="border-b py-2">In</th><th className="border-b py-2">Out</th><th className="border-b py-2">In location</th><th className="border-b py-2">Out location</th><th className="border-b py-2">Minutes</th><th className="border-b py-2">Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
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
