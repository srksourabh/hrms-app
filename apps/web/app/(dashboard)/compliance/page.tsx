import { DashboardShell } from "~/components/dashboard-shell";
import { Field, inputClass, PageTitle, selectClass, SubmitButton } from "~/components/hr/ui";
import { getCompliance, getSessionUser, tenantIdFor, updateComplianceStatus } from "~/lib/hr-direct";

const saudiComplianceTracks = [
  {
    title: "GOSI monthly submission",
    body: "Contribution wage cap, Saudi annuities, SANED, occupational hazards, registrations, exits, and penalty follow-up.",
    cadence: "Monthly",
  },
  {
    title: "Mudad WPS wage protection",
    body: "Payroll period approval, bank file readiness, exported rows, paid rows, and locked period evidence.",
    cadence: "Monthly",
  },
  {
    title: "Qiwa contracts",
    body: "Contract authentication, profession alignment, probation, working hours, notice period, and renewal status.",
    cadence: "On hire / renewal",
  },
  {
    title: "Iqama, work permit, and passport",
    body: "Expiry dates, employee document ownership, renewal queue, and overdue risk for expat employees.",
    cadence: "Daily watch",
  },
  {
    title: "Nitaqat and Saudization",
    body: "Saudi/non-Saudi workforce mix, target percentage, band status, and role-level Saudization requirements.",
    cadence: "Monthly",
  },
  {
    title: "CCHI health insurance",
    body: "Policy enrollment, dependent count, card status, coverage level, and policy expiry.",
    cadence: "Monthly / expiry",
  },
  {
    title: "Muqeem and sponsorship",
    body: "Visa, transfer, exit/re-entry, final exit, and sponsor-transfer references.",
    cadence: "Event based",
  },
  {
    title: "Saudi working calendar",
    body: "Friday/Saturday weekend assumptions, public holidays, Ramadan hours, overtime, and exception review.",
    cadence: "Annual + Ramadan",
  },
  {
    title: "Work injuries and HRDF",
    body: "GOSI work-injury claim references, Ministry reporting, training subsidies, and closure evidence.",
    cadence: "Event based",
  },
];

export default async function CompliancePage() {
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const items = await getCompliance(tenantId);

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle eyebrow="Saudi Arabia" title="Compliance" description="Track Qiwa contracts, Mudad WPS, GOSI, Iqama, work permit, Nitaqat, and Saudi labor-law obligations." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {saudiComplianceTracks.map((track) => (
          <div key={track.title} className="rounded-lg border border-amber-200 bg-[#fffaf0] p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">{track.title}</h2>
              <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                {track.cadence}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{track.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Live compliance queue</h2>
          <p className="mt-1 text-sm text-slate-600">Database-backed items that HR can update immediately.</p>
        </div>
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{item.itemType.replace("_", " ")}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.employeeName ?? "Company-level"} · Due {item.dueDate ?? "not set"}</p>
                {item.referenceNumber && <p className="mt-1 text-xs text-slate-500">Reference: {item.referenceNumber}</p>}
              </div>
              <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{item.status}</span>
            </div>
            <form action={updateComplianceStatus} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
              <input type="hidden" name="id" value={item.id} />
              <Field label="Status">
                <select name="status" className={selectClass} defaultValue={item.status}>
                  <option value="pending">Pending</option>
                  <option value="compliant">Compliant</option>
                  <option value="attention">Attention</option>
                  <option value="overdue">Overdue</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </Field>
              <Field label="Notes"><input name="notes" className={inputClass} defaultValue={item.notes ?? ""} /></Field>
              <div className="flex items-end"><SubmitButton>Update</SubmitButton></div>
            </form>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
