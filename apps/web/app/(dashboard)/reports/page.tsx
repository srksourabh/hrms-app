import { DashboardShell } from "~/components/dashboard-shell";
import { MetricCard, PageTitle } from "~/components/hr/ui";
import { getReports, getSessionUser, tenantIdFor } from "~/lib/hr-direct";

function money(value: number) {
  return `SAR ${Math.round(value).toLocaleString("en-US")}`;
}

export default async function ReportsPage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const reports = await getReports(tenantId);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Reports" title="Daily, weekly, and monthly reports" description="A simple HR management summary for attendance, leave, expenses, payroll, and compliance." />

      <section className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{report.reportType} report</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{report.periodStart} to {report.periodEnd}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{report.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricCard label="Headcount" value={String(report.headcount)} />
              <MetricCard label="Present" value={String(report.presentCount)} />
              <MetricCard label="Pending leave" value={String(report.leavePendingCount)} />
              <MetricCard label="Expenses" value={money(report.expensePendingAmount)} />
              <MetricCard label="Payroll net" value={money(report.payrollNetAmount)} />
              <MetricCard label="Compliance" value={String(report.complianceAttentionCount)} />
            </div>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
