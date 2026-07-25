import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  FileCheck2,
  Landmark,
  MapPinned,
  MapPin,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { DashboardShell } from "~/components/dashboard-shell";
import { DashboardProviders } from "~/components/dashboard-providers";
import { getSessionUser } from "~/lib/hr-direct";
import { saudiPayrollTracks } from "~/lib/saudi-payroll";

export default async function HomePage() {
  const user = await getSessionUser();
  const canManageEmployees = ["super_admin", "hr_manager", "hr_specialist"].includes(user.role ?? "");
  const primaryAction = canManageEmployees
    ? { href: "/employees", label: "Manage employees" }
    : { href: "/attendance/me", label: "Punch in/out" };
  const dashboardActions =
    user.role === "employee"
      ? [
          { href: "/attendance/me", label: "Punch in/out", icon: MapPin, detail: "Location-aware attendance" },
          { href: "/leave", label: "Leave", icon: CalendarCheck, detail: "My leave applications and status" },
          { href: "/expenses", label: "Expenses", icon: WalletCards, detail: "My claims and reimbursements" },
          { href: "/departments/organogram", label: "Organogram", icon: Users, detail: "My full reporting tree" },
        ]
      : [
          { href: "/attendance/me", label: "Punch in/out", icon: MapPin, detail: "Location-aware attendance" },
          { href: "/leave", label: "Leave approval", icon: CalendarCheck, detail: "Applications and manager approval" },
          { href: "/payroll", label: "Saudi payroll", icon: Landmark, detail: "GOSI, SANED, EOSB, Mudad WPS" },
          { href: "/expenses", label: "Expense approval", icon: WalletCards, detail: "Claims and reimbursement queue" },
          { href: "/locations", label: "Locations", icon: MapPinned, detail: "Field team and branch tracking" },
          { href: "/compliance", label: "Saudi compliance", icon: ShieldCheck, detail: "Qiwa, Iqama, Nitaqat, CCHI" },
          { href: "/departments/organogram", label: "Organogram", icon: Users, detail: "Manager and team structure" },
          { href: "/reports", label: "Reports", icon: BarChart3, detail: "Daily, weekly, monthly snapshots" },
          { href: "/compliance", label: "Audit evidence", icon: FileCheck2, detail: "Saudi regulatory readiness log" },
        ];

  const highlights = [
    { label: "Employees", value: canManageEmployees ? "Manage" : "Self service" },
    { label: "Departments", value: "Org tree" },
    { label: "Attendance", value: "Punch ready" },
    { label: "Leave", value: "Apply/approve" },
    { label: "Expenses", value: "Claim/approve" },
    { label: "Payroll", value: "Saudi ready" },
  ];

  return (
    <DashboardProviders session={{ user, expires: "" }}>
      <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-emerald-900/10 bg-[#fffaf0] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  Saudi HR command center
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Rukn Energy Services HR
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  A Saudi-ready HR workspace for employees, departments, designations, field attendance, locations,
                  leave, expenses, payroll, GOSI, Qiwa, Mudad WPS, compliance, and reports.
                </p>
              </div>
              <Link
                href={primaryAction.href}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                {primaryAction.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {dashboardActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-950">{item.label}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </Link>
              );
            })}
          </section>

          <section className="rounded-lg border border-amber-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Saudi HRMS coverage
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  Operational tracks present in this Saudi build
                </h2>
              </div>
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-amber-100">
                Saudi Arabia
              </span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {saudiPayrollTracks.map((track) => (
                <div
                  key={track}
                  className="rounded-md border border-slate-100 bg-[#f7f7f4] px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {track}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Employee portal",
                body: "Every employee can access punch in/out, leave, expenses, and their reporting tree.",
              },
              {
                title: "Admin and HR controls",
                body: "Admin and HR can manage employees, departments, designations, approvals, reports, and payroll.",
              },
              {
                title: "Saudi compliance",
                body: "Payroll and compliance coverage includes GOSI, SANED, EOSB, Mudad WPS, Qiwa, Iqama, Nitaqat, and CCHI.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </section>
        </div>
      </DashboardShell>
    </DashboardProviders>
  );
}
