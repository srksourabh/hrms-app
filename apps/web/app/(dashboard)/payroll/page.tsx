import { DashboardShell } from "~/components/dashboard-shell";
import { MetricCard, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import { getPayroll, getSessionUser, tenantIdFor, updatePayrollStatus } from "~/lib/hr-direct";
import { calculateSaudiGosi, SAUDI_GOSI_RULES } from "~/lib/saudi-payroll";

function money(value: number) {
  return `SAR ${Math.round(value).toLocaleString("en-US")}`;
}

export default async function PayrollPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const { periods, items } = await getPayroll(tenantId);
  const activePeriod = periods[0];
  const expectedEmployeeGosi = items.reduce((sum, item) => sum + calculateSaudiGosi(item).employeeTotal, 0);
  const expectedEmployerGosi = items.reduce((sum, item) => sum + calculateSaudiGosi(item).employerTotal, 0);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Payroll" title="Saudi payroll" description="Full-width payroll control for salary, allowances, GOSI, SANED, occupational hazards, EOSB accrual, Mudad WPS, Qiwa contract readiness, and payment status." />

      {activePeriod && (
        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Gross pay" value={money(activePeriod.grossPay)} />
          <MetricCard label="Employee GOSI" value={money(activePeriod.employeeGosi)} />
          <MetricCard label="Employer GOSI" value={money(activePeriod.employerGosi)} />
          <MetricCard label="Net pay" value={money(activePeriod.netPay)} detail={activePeriod.status.replace("_", " ")} />
        </section>
      )}

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="rounded-lg border border-amber-200 bg-[#fffaf0] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Saudi statutory model</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">GOSI and payroll checks</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Contribution wage is shown against a SAR {SAUDI_GOSI_RULES.contributoryWageCap.toLocaleString("en-US")} cap. Saudi nationals carry annuities and SANED; occupational hazards are employer-side for all employees.
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            {[
              SAUDI_GOSI_RULES.annuities,
              SAUDI_GOSI_RULES.saned,
              SAUDI_GOSI_RULES.occupationalHazards,
            ].map((rule) => (
              <div key={rule.label} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-100 bg-white px-3 py-2">
                <span className="font-medium text-slate-900">{rule.label}</span>
                <span className="text-slate-600">
                  Employee {(rule.employeeRate * 100).toFixed(rule.employeeRate < 0.01 ? 2 : 0)}% / Employer {(rule.employerRate * 100).toFixed(rule.employerRate < 0.01 ? 2 : 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Expected employee contribution" value={money(expectedEmployeeGosi)} detail="Annuities + SANED for Saudi nationals" />
          <MetricCard label="Expected employer contribution" value={money(expectedEmployerGosi)} detail="Annuities + SANED + occupational hazards" />
          <MetricCard label="Mudad WPS rows" value={String(items.length)} detail="Each employee must be ready for wage protection export" />
          <MetricCard label="Qiwa contract checks" value={String(items.filter((item) => item.qiwaContractStatus === "authenticated").length)} detail="Authenticated contracts in this payroll list" />
        </div>
      </section>

      {activePeriod && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Payroll period</h2>
              <p className="mt-1 text-sm text-slate-600">{activePeriod.periodMonth}</p>
            </div>
            <form action={updatePayrollStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={activePeriod.id} />
              <select name="status" className={selectClass} defaultValue={activePeriod.status}>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="wps_exported">WPS exported</option>
                <option value="paid">Paid</option>
                <option value="locked">Locked</option>
              </select>
              <SubmitButton>Update payroll</SubmitButton>
            </form>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1360px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="border-b py-2">Employee</th><th className="border-b py-2">Nationality</th><th className="border-b py-2">Basic</th><th className="border-b py-2">Housing</th><th className="border-b py-2">Transport</th><th className="border-b py-2">GOSI base</th><th className="border-b py-2">Annuities</th><th className="border-b py-2">SANED</th><th className="border-b py-2">OH employer</th><th className="border-b py-2">Recorded employee</th><th className="border-b py-2">Recorded employer</th><th className="border-b py-2">EOSB accrual</th><th className="border-b py-2">Net pay</th><th className="border-b py-2">Qiwa</th><th className="border-b py-2">WPS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const gosi = calculateSaudiGosi(item);
                  return (
                    <tr key={item.id}>
                      <td className="border-b border-slate-100 py-3 font-medium text-slate-900">{item.fullName}</td>
                      <td className="border-b border-slate-100 py-3">{item.nationality}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.basicSalary)}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.housingAllowance)}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.transportAllowance)}</td>
                      <td className="border-b border-slate-100 py-3">{money(gosi.contributionBase)}</td>
                      <td className="border-b border-slate-100 py-3">{money(gosi.annuitiesEmployee)} / {money(gosi.annuitiesEmployer)}</td>
                      <td className="border-b border-slate-100 py-3">{money(gosi.sanedEmployee)} / {money(gosi.sanedEmployer)}</td>
                      <td className="border-b border-slate-100 py-3">{money(gosi.occupationalHazardsEmployer)}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.employeeGosi)}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.employerGosi)}</td>
                      <td className="border-b border-slate-100 py-3">{money(item.eosbAccrual)}</td>
                      <td className="border-b border-slate-100 py-3 font-semibold">{money(item.netPay)}</td>
                      <td className="border-b border-slate-100 py-3">{item.qiwaContractStatus.replace("_", " ")}</td>
                      <td className="border-b border-slate-100 py-3">{item.wpsStatus.replace("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
