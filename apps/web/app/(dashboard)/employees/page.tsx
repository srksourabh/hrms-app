import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import {
  createEmployee,
  deleteEmployee,
  getDepartments,
  getDesignations,
  getEmployees,
  getSessionUser,
  tenantIdFor,
  updateEmployeeAccessRole,
  updateEmployee,
} from "~/lib/hr-direct";

const employeeAccessRoles = [
  { value: "employee", label: "Employee" },
  { value: "department_manager", label: "Project Manager" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "hr_specialist", label: "HR Specialist" },
  { value: "payroll_admin", label: "Payroll Admin" },
  { value: "super_admin", label: "Admin" },
];

export default async function EmployeesPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [employees, departments, designations] = await Promise.all([
    getEmployees(tenantId),
    getDepartments(tenantId),
    getDesignations(tenantId),
  ]);
  const isAdmin = user.role === "super_admin";
  const canManageEmployees = ["super_admin", "hr_manager", "hr_specialist"].includes(user.role ?? "");

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle
        eyebrow="People"
        title="Employees"
        description="Add, update, delete, and remove employees directly in Supabase. Salary fields feed the Saudi payroll base."
      />

      {canManageEmployees ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Add employee</h2>
          <form action={createEmployee} className="mt-4 grid gap-3 md:grid-cols-4">
            <Field label="Code"><input name="employeeCode" required className={inputClass} placeholder="RUKN-006" /></Field>
            <Field label="Full name"><input name="fullName" required className={inputClass} /></Field>
            <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
            <Field label="Phone"><input name="phone" className={inputClass} /></Field>
            <Field label="Nationality"><input name="nationality" className={inputClass} defaultValue="Saudi" /></Field>
            <Field label="Department">
              <select name="departmentId" className={selectClass} defaultValue="">
                <option value="">None</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <select name="designationId" className={selectClass} defaultValue="">
                <option value="">None</option>
                {designations.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </Field>
            <Field label="Manager">
              <select name="managerEmployeeId" className={selectClass} defaultValue="">
                <option value="">None</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </Field>
            <Field label="Hire date"><input name="hireDate" type="date" className={inputClass} defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Status">
              <select name="employmentStatus" className={selectClass} defaultValue="active">
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </Field>
            <Field label="Basic salary"><input name="baseSalary" type="number" className={inputClass} defaultValue="0" /></Field>
            <Field label="Housing"><input name="housingAllowance" type="number" className={inputClass} defaultValue="0" /></Field>
            <Field label="Transport"><input name="transportAllowance" type="number" className={inputClass} defaultValue="0" /></Field>
            <Field label="Qiwa contract">
              <select name="qiwaContractStatus" className={selectClass} defaultValue="pending">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="not_required">Not required</option>
              </select>
            </Field>
            <div className="flex items-end"><SubmitButton>Add employee</SubmitButton></div>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Employee directory</h2>
          <p className="mt-1 text-sm text-slate-600">Admin and HR can create or edit employee records.</p>
        </section>
      )}

      <section className="mt-6 space-y-3">
        {employees.map((employee) => (
          <div key={employee.id} className="rounded-lg border border-slate-200 bg-white p-4">
            {canManageEmployees ? (
              <form action={updateEmployee} className="grid gap-3 lg:grid-cols-12">
                <input type="hidden" name="id" value={employee.id} />
                <div className="lg:col-span-2"><Field label="Name"><input name="fullName" className={inputClass} defaultValue={employee.fullName} /></Field></div>
                <div className="lg:col-span-2"><Field label="Email"><input name="email" type="email" className={inputClass} defaultValue={employee.email} /></Field></div>
                <div><Field label="Phone"><input name="phone" className={inputClass} defaultValue={employee.phone ?? ""} /></Field></div>
                <div><Field label="Department"><select name="departmentId" className={selectClass} defaultValue={employee.departmentId ?? ""}><option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field></div>
                <div><Field label="Designation"><select name="designationId" className={selectClass} defaultValue={employee.designationId ?? ""}><option value="">None</option>{designations.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select></Field></div>
                <div><Field label="Manager"><select name="managerEmployeeId" className={selectClass} defaultValue={employee.managerEmployeeId ?? ""}><option value="">None</option>{employees.filter((e) => e.id !== employee.id).map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field></div>
                <div><Field label="Status"><select name="employmentStatus" className={selectClass} defaultValue={employee.employmentStatus}><option value="active">Active</option><option value="on_leave">On leave</option><option value="suspended">Suspended</option><option value="terminated">Terminated</option></select></Field></div>
                <div><Field label="Basic"><input name="baseSalary" type="number" className={inputClass} defaultValue={employee.baseSalary} /></Field></div>
                <div><Field label="Housing"><input name="housingAllowance" type="number" className={inputClass} defaultValue={employee.housingAllowance} /></Field></div>
                <div><Field label="Transport"><input name="transportAllowance" type="number" className={inputClass} defaultValue={employee.transportAllowance} /></Field></div>
                <div><Field label="Qiwa"><select name="qiwaContractStatus" className={selectClass} defaultValue={employee.qiwaContractStatus}><option value="pending">Pending</option><option value="active">Active</option><option value="expired">Expired</option><option value="not_required">Not required</option></select></Field></div>
                <div className="flex items-end gap-2 lg:col-span-12">
                  <SubmitButton>Update employee</SubmitButton>
                  <span className="text-xs text-slate-500">{employee.employeeCode} - {employee.locationName ?? "No location"}</span>
                </div>
              </form>
            ) : (
              <div>
                <p className="font-semibold text-slate-950">{employee.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">{employee.employeeCode} - {employee.departmentName ?? "No department"} - {employee.designationTitle ?? "No designation"}</p>
                <p className="mt-1 text-xs text-slate-500">{employee.email} - {employee.locationName ?? "No location"}</p>
              </div>
            )}
            <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Login access</p>
                  <p className="mt-1 truncate text-xs text-slate-600">
                    Current role: <span className="font-semibold capitalize text-slate-900">{employee.accessRole?.replaceAll("_", " ") ?? "No login account"}</span>
                    {employee.accessEmails ? <span> - {employee.accessEmails}</span> : null}
                  </p>
                </div>
                {isAdmin ? (
                  <form action={updateEmployeeAccessRole} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <Field label="Promote / role">
                      <select name="role" className={selectClass} defaultValue={employee.accessRole ?? "employee"}>
                        {employeeAccessRoles.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </Field>
                    <SubmitButton tone="light">Save role</SubmitButton>
                  </form>
                ) : (
                  <p className="text-xs font-medium text-slate-500">Only Admin can promote users or grant HR access.</p>
                )}
              </div>
            </div>
            {canManageEmployees ? (
              <form action={deleteEmployee} className="mt-3">
                <input type="hidden" name="id" value={employee.id} />
                <SubmitButton tone="danger">Delete employee</SubmitButton>
              </form>
            ) : null}
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
