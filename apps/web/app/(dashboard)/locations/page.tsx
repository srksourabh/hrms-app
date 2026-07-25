import { DashboardShell } from "~/components/dashboard-shell";
import { MetricCard, PageTitle } from "~/components/hr/ui";
import { getLocationTracking, getSessionUser, tenantIdFor } from "~/lib/hr-direct";

function coordinate(value: number | null) {
  return typeof value === "number" ? value.toFixed(5) : "-";
}

export default async function LocationsPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const locations = await getLocationTracking(tenantId);
  const withCoordinates = locations.filter((row) => row.latitude !== null && row.longitude !== null).length;
  const openSessions = locations.filter((row) => row.lastPunchInAt && !row.lastPunchOutAt).length;
  const cities = new Set(locations.map((row) => row.city).filter(Boolean)).size;

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle
        eyebrow="Locations"
        title="Field location tracking"
        description="Field-ready visibility for assigned branch, latest punch location, live/open sessions, and Saudi city coverage."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Tracked employees" value={String(locations.length)} />
        <MetricCard label="With coordinates" value={String(withCoordinates)} />
        <MetricCard label="Open sessions" value={String(openSessions)} />
        <MetricCard label="Saudi cities" value={String(cities)} />
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-[#fffaf0] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Middle East operations</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">Field operations location rules</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <p className="rounded-md bg-white p-3">Punch-in and punch-out can record the branch, city, latitude, and longitude.</p>
          <p className="rounded-md bg-white p-3">HR can review open sessions and exception statuses from the attendance portal.</p>
          <p className="rounded-md bg-white p-3">Reports connect attendance, leave, payroll, and compliance in one monthly management view.</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="border-b py-2">Employee</th>
                <th className="border-b py-2">Department</th>
                <th className="border-b py-2">Designation</th>
                <th className="border-b py-2">Assigned location</th>
                <th className="border-b py-2">City</th>
                <th className="border-b py-2">Last date</th>
                <th className="border-b py-2">Latest location</th>
                <th className="border-b py-2">Coordinates</th>
                <th className="border-b py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((row) => (
                <tr key={row.employeeId}>
                  <td className="border-b border-slate-100 py-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.departmentName ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.designationTitle ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.assignedLocation ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.city ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.lastWorkDate ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.lastLocationName ?? "-"}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{coordinate(row.latitude)}, {coordinate(row.longitude)}</td>
                  <td className="border-b border-slate-100 py-3 text-slate-600">{row.status ?? "not punched"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
