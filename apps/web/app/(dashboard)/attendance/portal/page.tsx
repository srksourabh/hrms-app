import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass } from "~/components/hr/ui";
import { getAttendance, getEmployees, getSessionUser, punchAttendance, tenantIdFor } from "~/lib/hr-direct";

export default async function AttendancePortalPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [employees, attendance] = await Promise.all([getEmployees(tenantId), getAttendance(tenantId)]);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Attendance" title="Attendance portal" description="HR can punch employees in or out and track the workplace location." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <form action={punchAttendance} className="grid gap-3 md:grid-cols-6">
          <Field label="Employee"><select name="employeeId" className={selectClass}>{employees.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} · {e.fullName}</option>)}</select></Field>
          <Field label="Location label"><input name="locationName" className={inputClass} defaultValue="Riyadh HQ" /></Field>
          <Field label="Latitude"><input name="latitude" type="number" step="0.0000001" className={inputClass} /></Field>
          <Field label="Longitude"><input name="longitude" type="number" step="0.0000001" className={inputClass} /></Field>
          <div className="flex items-end gap-2 md:col-span-2">
            <button name="mode" value="in" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Punch in</button>
            <button name="mode" value="out" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Punch out</button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Recent attendance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="border-b py-2">Employee</th><th className="border-b py-2">Date</th><th className="border-b py-2">In</th><th className="border-b py-2">Out</th><th className="border-b py-2">Location</th><th className="border-b py-2">Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-100 py-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="border-b border-slate-100 py-3">{row.workDate}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchOutAt ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3">{row.punchInLocation ?? row.punchOutLocation ?? "-"}</td>
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
