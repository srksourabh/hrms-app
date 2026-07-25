import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import { createExpense, decideExpense, getEmployees, getExpenses, getSessionUser, tenantIdFor } from "~/lib/hr-direct";

const categories = ["travel", "meals", "fuel", "accommodation", "visa_iqama", "office", "other"];

export default async function ExpensesPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const isEmployee = user.role === "employee";
  const selectedEmployeeId = user.employeeId || undefined;
  const [employees, expenses] = await Promise.all([
    getEmployees(tenantId),
    getExpenses(tenantId, isEmployee ? user.employeeId : null),
  ]);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Expenses" title="Expense application and approval" description="Track employee claims, approvals, and payroll reimbursement readiness." />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">New expense application</h2>
        <form action={createExpense} className="mt-4 grid gap-3 md:grid-cols-6">
          {!isEmployee && <Field label="Employee"><select name="employeeId" className={selectClass} defaultValue={selectedEmployeeId}>{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field>}
          <Field label="Date"><input name="expenseDate" type="date" className={inputClass} defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="Category"><select name="category" className={selectClass}>{categories.map((category) => <option key={category} value={category}>{category.replace("_", " ")}</option>)}</select></Field>
          <Field label="Amount"><input name="amount" type="number" step="0.01" required className={inputClass} /></Field>
          <Field label="Description"><input name="description" className={inputClass} /></Field>
          <div className="flex items-end"><SubmitButton>Apply expense</SubmitButton></div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Expense queue</h2>
        <div className="mt-4 space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-md border border-slate-100 p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{expense.fullName} · {expense.category.replace("_", " ")}</p>
                  <p className="mt-1 text-xs text-slate-500">{expense.expenseDate} · {expense.currency} {expense.amount.toLocaleString("en-US")}</p>
                  {expense.description && <p className="mt-2 text-sm text-slate-600">{expense.description}</p>}
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{expense.status}</span>
              </div>
              {!isEmployee && (
                <form action={decideExpense} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={expense.id} />
                  <input name="managerComment" className={inputClass} placeholder="Manager comment" />
                  <button name="status" value="approved" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                  <button name="status" value="rejected" className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Reject</button>
                  <button name="status" value="paid" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Mark paid</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
