import { DashboardShell } from "~/components/dashboard-shell";
import { MetricCard, PageTitle } from "~/components/hr/ui";
import { getAttendance, getReports, getSessionUser, tenantIdFor } from "~/lib/hr-direct";

export default async function AttendanceReportsPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [attendance, reports] = await Promise.all([getAttendance(tenantId), getReports(tenantId)]);
  const present = attendance.filter((row) => row.status === "present").length;
  const review = attendance.filter((row) => row.status === "manual_review").length;

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Attendance reports" title="Daily attendance view" description="Punch-in, punch-out, location, and exception state for the team." />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Attendance records" value={String(attendance.length)} />
        <MetricCard label="Present" value={String(present)} />
        <MetricCard label="Manual review" value={String(review)} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{report.reportType}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{report.periodStart} to {report.periodEnd}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{report.summary}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="border-b py-2">Employee</th><th className="border-b py-2">Date</th><th className="border-b py-2">In</th><th className="border-b py-2">Out</th><th className="border-b py-2">Location</th><th className="border-b py-2">Minutes</th><th className="border-b py-2">Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-100 py-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="border-b border-slate-100 py-3">{row.workDate}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchOutAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInLocation ?? row.punchOutLocation ?? "-"}</td>
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
