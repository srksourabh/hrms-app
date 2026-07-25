import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle } from "~/components/hr/ui";
import { getAttendance, getSessionUser, punchAttendance, tenantIdFor } from "~/lib/hr-direct";

export default async function MyAttendancePage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const attendance = await getAttendance(tenantId, user.employeeId);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Attendance" title="Punch in / punch out" description="Location fields are saved with every punch so HR can verify where attendance was recorded." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <form action={punchAttendance} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="employeeId" value={user.employeeId ?? ""} />
          <Field label="Location label"><input name="locationName" className={inputClass} defaultValue="Riyadh HQ" /></Field>
          <Field label="Latitude"><input name="latitude" type="number" step="0.0000001" className={inputClass} placeholder="24.7136000" /></Field>
          <Field label="Longitude"><input name="longitude" type="number" step="0.0000001" className={inputClass} placeholder="46.6753000" /></Field>
          <div className="flex items-end gap-2">
            <button name="mode" value="in" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Punch in</button>
            <button name="mode" value="out" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Punch out</button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">My attendance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="border-b py-2">Date</th><th className="border-b py-2">In</th><th className="border-b py-2">Out</th><th className="border-b py-2">Location</th><th className="border-b py-2">Minutes</th><th className="border-b py-2">Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
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
