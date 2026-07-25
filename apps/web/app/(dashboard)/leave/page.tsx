import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import {
  createLeaveRequest,
  decideLeave,
  getEmployees,
  getLeaveRequests,
  getLeaveTypes,
  getSessionUser,
  tenantIdFor,
} from "~/lib/hr-direct";

export default async function LeavePage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const isEmployee = user.role === "employee";
  const [employees, leaveTypes, requests] = await Promise.all([
    getEmployees(tenantId),
    getLeaveTypes(tenantId),
    getLeaveRequests(tenantId, isEmployee ? user.employeeId : null),
  ]);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Leave" title="Leave application and approval" description="Employees can apply for leave. HR and managers can approve or reject requests." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">New leave application</h2>
        <form action={createLeaveRequest} className="mt-4 grid gap-3 md:grid-cols-6">
          {!isEmployee && (
            <Field label="Employee">
              <select name="employeeId" className={selectClass}>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </Field>
          )}
          <Field label="Leave type"><select name="leaveTypeId" className={selectClass}>{leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Start date"><input name="startDate" type="date" required className={inputClass} /></Field>
          <Field label="End date"><input name="endDate" type="date" required className={inputClass} /></Field>
          <Field label="Days"><input name="days" type="number" step="0.5" required className={inputClass} defaultValue="1" /></Field>
          <Field label="Reason"><input name="reason" className={inputClass} /></Field>
          <div className="flex items-end"><SubmitButton>Apply leave</SubmitButton></div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Leave details</h2>
        <div className="mt-4 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-md border border-slate-100 p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{request.fullName} · {request.leaveType ?? "Leave"}</p>
                  <p className="mt-1 text-xs text-slate-500">{request.startDate} to {request.endDate} · {request.days} days</p>
                  {request.reason && <p className="mt-2 text-sm text-slate-600">{request.reason}</p>}
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{request.status}</span>
              </div>
              {!isEmployee && (
                <form action={decideLeave} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input name="managerComment" className={inputClass} placeholder="Manager comment" />
                  <button name="status" value="approved" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                  <button name="status" value="rejected" className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Reject</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
