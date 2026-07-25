import { DashboardShell } from "~/components/dashboard-shell";
import { PageTitle } from "~/components/hr/ui";
import { getDepartments, getEmployees, getSessionUser, tenantIdFor } from "~/lib/hr-direct";

export default async function OrganogramPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [departments, employees] = await Promise.all([getDepartments(tenantId), getEmployees(tenantId)]);
  const topLevel = employees.filter((employee) => !employee.managerEmployeeId);

  function directReports(managerId: string) {
    return employees.filter((employee) => employee.managerEmployeeId === managerId);
  }

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="HR manager organogram" title="Organogram" description="Manager, department, and designation relationships from the fresh Supabase HR tables." />

      <section className="grid gap-4 xl:grid-cols-[1fr_.7fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Leadership tree</h2>
          <div className="mt-4 space-y-4">
            {topLevel.map((leader) => (
              <div key={leader.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-sm font-semibold text-slate-950">{leader.fullName}</p>
                <p className="text-xs text-slate-600">{leader.designationTitle ?? "-"} · {leader.departmentName ?? "-"}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {directReports(leader.id).map((report) => (
                    <div key={report.id} className="rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{report.fullName}</p>
                      <p className="text-xs text-slate-500">{report.designationTitle ?? "-"} · {report.departmentName ?? "-"}</p>
                      <div className="mt-2 space-y-2">
                        {directReports(report.id).map((subReport) => (
                          <div key={subReport.id} className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            {subReport.fullName} · {subReport.designationTitle ?? "-"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Department ownership</h2>
          <div className="mt-4 space-y-3">
            {departments.map((department) => (
              <div key={department.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{department.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{department.employeeCount} people</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Manager: {department.managerName ?? "Not assigned"}</p>
                <p className="mt-1 text-xs text-slate-500">City: {department.locationCity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
