import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getEmployees,
  getSessionUser,
  tenantIdFor,
  updateDepartment,
} from "~/lib/hr-direct";

export default async function DepartmentsPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [departments, employees] = await Promise.all([getDepartments(tenantId), getEmployees(tenantId)]);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Organization" title="Departments" description="Create, update, and remove departments for the HR manager organogram." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Add department</h2>
        <form action={createDepartment} className="mt-4 grid gap-3 md:grid-cols-6">
          <Field label="Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Arabic name"><input name="nameAr" className={inputClass} /></Field>
          <Field label="Code"><input name="code" required className={inputClass} placeholder="OPS" /></Field>
          <Field label="Manager">
            <select name="managerEmployeeId" className={selectClass} defaultValue="">
              <option value="">None</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </Field>
          <Field label="Cost center"><input name="costCenter" className={inputClass} /></Field>
          <Field label="City"><input name="locationCity" className={inputClass} defaultValue="Riyadh" /></Field>
          <div className="flex items-end"><SubmitButton>Add department</SubmitButton></div>
        </form>
      </section>

      <section className="mt-6 grid gap-3">
        {departments.map((department) => (
          <div key={department.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <form action={updateDepartment} className="grid gap-3 md:grid-cols-7">
              <input type="hidden" name="id" value={department.id} />
              <Field label="Name"><input name="name" className={inputClass} defaultValue={department.name} /></Field>
              <Field label="Arabic name"><input name="nameAr" className={inputClass} defaultValue={department.nameAr ?? ""} /></Field>
              <Field label="Code"><input name="code" className={inputClass} defaultValue={department.code} /></Field>
              <Field label="Manager">
                <select name="managerEmployeeId" className={selectClass} defaultValue={department.managerEmployeeId ?? ""}>
                  <option value="">None</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                </select>
              </Field>
              <Field label="Cost center"><input name="costCenter" className={inputClass} defaultValue="" /></Field>
              <Field label="City"><input name="locationCity" className={inputClass} defaultValue={department.locationCity} /></Field>
              <label className="flex items-end gap-2 text-sm text-slate-700">
                <input type="checkbox" name="isActive" defaultChecked={department.isActive} />
                Active
              </label>
              <div className="flex items-center gap-3 md:col-span-7">
                <SubmitButton>Update department</SubmitButton>
                <span className="text-xs text-slate-500">{department.employeeCount} active employees</span>
              </div>
            </form>
            <form action={deleteDepartment} className="mt-3">
              <input type="hidden" name="id" value={department.id} />
              <SubmitButton tone="danger">Remove department</SubmitButton>
            </form>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
