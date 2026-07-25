import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  FileCheck2,
  GitBranch,
  LayoutDashboard,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { DashboardShell } from "~/components/dashboard-shell";
import { PageTitle } from "~/components/hr/ui";
import { getSessionUser } from "~/lib/hr-direct";

const allItems = [
  { href: "/", label: "Dashboard", detail: "Company and self-service summary", icon: LayoutDashboard, employee: true },
  { href: "/attendance/me", label: "Punch in/out", detail: "Open the working attendance punch page", icon: MapPin, employee: true },
  { href: "/departments/organogram", label: "Organogram", detail: "See your reporting tree below you", icon: GitBranch, employee: true },
  { href: "/leave", label: "Leave", detail: "Apply for leave and review leave details", icon: CalendarCheck, employee: true },
  { href: "/expenses", label: "Expenses", detail: "Submit and track expense claims", icon: WalletCards, employee: true },
  { href: "/employees", label: "Employees", detail: "Employee directory and HR master data", icon: Users },
  { href: "/departments", label: "Departments", detail: "Organization departments", icon: Building2 },
  { href: "/designations", label: "Designations", detail: "Job titles and salary bands", icon: BriefcaseBusiness },
  { href: "/attendance/portal", label: "Attendance portal", detail: "HR team attendance punching and review", icon: CalendarCheck },
  { href: "/attendance/reports", label: "Attendance reports", detail: "Daily attendance and exception view", icon: BarChart3 },
  { href: "/payroll", label: "Payroll", detail: "Saudi payroll, GOSI, WPS and EOSB", icon: BriefcaseBusiness },
  { href: "/compliance", label: "Saudi compliance", detail: "GOSI, Qiwa, WPS, Iqama and Nitaqat tracking", icon: ShieldCheck },
  { href: "/reports", label: "Daily / weekly / monthly", detail: "Operational HR reports", icon: FileCheck2 },
];

export default async function SearchPage() {
  const user = await getSessionUser();
  const items = user.role === "employee" ? allItems.filter((item) => item.employee) : allItems;

  return (
    <DashboardShell user={user} regulatoryContext="saudi" preferredLanguage={user.preferredLanguage ?? "en"}>
      <PageTitle
        eyebrow="Search"
        title="Find people, modules and actions"
        description="Open the HRMS page you need. Employee accounts only see employee-safe actions."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <span>Choose an action below</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-950">{item.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">{item.detail}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
