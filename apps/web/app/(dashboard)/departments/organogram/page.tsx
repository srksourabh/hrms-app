import { DashboardShell } from "~/components/dashboard-shell";
import { PageTitle } from "~/components/hr/ui";
import { getDepartments, getEmployees, getSessionUser, tenantIdFor, type EmployeeRow } from "~/lib/hr-direct";

function collectTreeIds(rootId: string, employees: EmployeeRow[]) {
  const ids = new Set<string>([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const managerId = queue.shift();
    const reports = employees.filter((employee) => employee.managerEmployeeId === managerId);
    for (const report of reports) {
      if (!ids.has(report.id)) {
        ids.add(report.id);
        queue.push(report.id);
      }
    }
  }

  return ids;
}

export default async function OrganogramPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [departments, employees] = await Promise.all([getDepartments(tenantId), getEmployees(tenantId)]);
  const rootEmployee = employees.find((employee) => employee.id === user.employeeId) ?? null;
  const visibleIds = rootEmployee ? collectTreeIds(rootEmployee.id, employees) : new Set(employees.map((employee) => employee.id));
  const visibleEmployees = employees.filter((employee) => visibleIds.has(employee.id));
  const rootNodes = rootEmployee ? [rootEmployee] : visibleEmployees.filter((employee) => !employee.managerEmployeeId);

  function directReports(managerId: string) {
    return visibleEmployees.filter((employee) => employee.managerEmployeeId === managerId);
  }

  function OrgNode({ employee, depth = 0 }: { employee: EmployeeRow; depth?: number }) {
    const reports = directReports(employee.id);
    return (
      <div className={depth === 0 ? "rounded-lg border border-emerald-100 bg-emerald-50/60 p-4" : "rounded-md border border-slate-200 bg-white p-3"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{employee.fullName}</p>
            <p className="mt-1 text-xs text-slate-600">{employee.designationTitle ?? "No designation"} - {employee.departmentName ?? "No department"}</p>
          </div>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {reports.length} direct report{reports.length === 1 ? "" : "s"}
          </span>
        </div>
        {reports.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-emerald-200 pl-4">
            {reports.map((report) => (
              <OrgNode key={report.id} employee={report} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle
        eyebrow="Organization structure"
        title="My reporting tree"
        description="Every employee sees their own employee node and the full reporting tree below them, regardless of designation or project role."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_.7fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Tree below me</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rootEmployee
                  ? `${visibleEmployees.length} employee${visibleEmployees.length === 1 ? "" : "s"} in this view.`
                  : "No employee profile is linked to this login, so the full company tree is shown."}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {rootNodes.map((employee) => (
              <OrgNode key={employee.id} employee={employee} />
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
