import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import {
  createDesignation,
  deleteDesignation,
  getDepartments,
  getDesignations,
  getSessionUser,
  tenantIdFor,
  updateDesignation,
} from "~/lib/hr-direct";

export default async function DesignationsPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const [designations, departments] = await Promise.all([getDesignations(tenantId), getDepartments(tenantId)]);
  const canManageOrg = ["super_admin", "hr_manager", "hr_specialist"].includes(user.role ?? "");

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Organization" title="Designations" description="Create, update, and remove job titles and salary bands." />

      {canManageOrg ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Add designation</h2>
          <form action={createDesignation} className="mt-4 grid gap-3 md:grid-cols-7">
            <Field label="Title"><input name="title" required className={inputClass} /></Field>
            <Field label="Arabic title"><input name="titleAr" className={inputClass} /></Field>
            <Field label="Department">
              <select name="departmentId" className={selectClass} defaultValue="">
                <option value="">None</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Grade"><input name="grade" className={inputClass} placeholder="P2" /></Field>
            <Field label="Min salary"><input name="minSalary" type="number" className={inputClass} defaultValue="0" /></Field>
            <Field label="Max salary"><input name="maxSalary" type="number" className={inputClass} defaultValue="0" /></Field>
            <label className="flex items-end gap-2 text-sm text-slate-700"><input type="checkbox" name="isManagerial" /> Managerial</label>
            <div className="flex items-end"><SubmitButton>Add designation</SubmitButton></div>
          </form>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3">
        {designations.map((designation) => (
          <div key={designation.id} className="rounded-lg border border-slate-200 bg-white p-4">
            {canManageOrg ? (
              <>
                <form action={updateDesignation} className="grid gap-3 md:grid-cols-8">
                  <input type="hidden" name="id" value={designation.id} />
                  <Field label="Title"><input name="title" className={inputClass} defaultValue={designation.title} /></Field>
                  <Field label="Arabic title"><input name="titleAr" className={inputClass} defaultValue={designation.titleAr ?? ""} /></Field>
                  <Field label="Department"><select name="departmentId" className={selectClass} defaultValue={designation.departmentId ?? ""}><option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
                  <Field label="Grade"><input name="grade" className={inputClass} defaultValue={designation.grade ?? ""} /></Field>
                  <Field label="Min"><input name="minSalary" type="number" className={inputClass} defaultValue={designation.minSalary} /></Field>
                  <Field label="Max"><input name="maxSalary" type="number" className={inputClass} defaultValue={designation.maxSalary} /></Field>
                  <label className="flex items-end gap-2 text-sm text-slate-700"><input type="checkbox" name="isManagerial" defaultChecked={designation.isManagerial} /> Managerial</label>
                  <label className="flex items-end gap-2 text-sm text-slate-700"><input type="checkbox" name="isActive" defaultChecked={designation.isActive} /> Active</label>
                  <div className="flex items-center gap-3 md:col-span-8">
                    <SubmitButton>Update designation</SubmitButton>
                    <span className="text-xs text-slate-500">{designation.departmentName ?? "No department"}</span>
                  </div>
                </form>
                <form action={deleteDesignation} className="mt-3">
                  <input type="hidden" name="id" value={designation.id} />
                  <SubmitButton tone="danger">Remove designation</SubmitButton>
                </form>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{designation.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{designation.departmentName ?? "No department"} - {designation.grade ?? "No grade"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{designation.isActive ? "Active" : "Inactive"}</span>
              </div>
            )}
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
