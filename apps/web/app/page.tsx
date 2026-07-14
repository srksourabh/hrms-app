import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";
import { can, type AppRole, type Capability } from "@hrms-app/auth/rbac";
import { taazurEnergyDemo } from "@hrms-app/demo";
import { adminDb, getTenantDb, tenants } from "@hrms-app/db";
import { eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Grid2X2,
  Landmark,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardShell } from "~/components/dashboard-shell";
import { EmployeeCommandCenter } from "~/components/demo/employee-command-center";
import { productModules, totalPrdFeatures } from "~/lib/module-catalog";

const featuredSlugs = [
  "people-organization",
  "payroll-settlement",
  "recruitment",
  "nitaqat-compliance",
  "ai-intelligence",
  "performance-goals",
];

interface DbCounts {
  activeCount: number;
  departmentCount: number;
  openJobsCount: number;
  totalHeadcount: number;
  payslipCount: number;
}

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const isDemo = session.user.id.startsWith("demo-");
  const isEmployee = session.user.role === "employee";

  // Fetch counts from the database on the server side
  let dbCounts: DbCounts | null = null;
  if (session.user.tenantId) {
    try {
      const tenant = await adminDb.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
      });

      if (tenant) {
        const tenantDb = getTenantDb(tenant.schemaName);
        const [empCount] = await tenantDb.execute(sql`SELECT COUNT(*)::int as count FROM ${sql.identifier(tenant.schemaName)}."employees" WHERE "employment_status" = 'active'`);
        const [deptCount] = await tenantDb.execute(sql`SELECT COUNT(*)::int as count FROM ${sql.identifier(tenant.schemaName)}."departments"`);
        const [jobCount] = await tenantDb.execute(sql`SELECT COUNT(*)::int as count FROM ${sql.identifier(tenant.schemaName)}."job_requisitions" WHERE "status" = 'open'`);
        const [totalHeadcount] = await tenantDb.execute(sql`SELECT COUNT(*)::int as count FROM ${sql.identifier(tenant.schemaName)}."employees"`);
        const [payslipCount] = await tenantDb.execute(sql`SELECT COUNT(*)::int as count FROM ${sql.identifier(tenant.schemaName)}."payslips"`);

        if (totalHeadcount && Number(totalHeadcount.count) > 0) {
          dbCounts = {
            activeCount: Number(empCount?.count ?? 0),
            departmentCount: Number(deptCount?.count ?? 0),
            openJobsCount: Number(jobCount?.count ?? 0),
            totalHeadcount: Number(totalHeadcount?.count ?? 0),
            payslipCount: Number(payslipCount?.count ?? 0),
          };
        }
      }
    } catch (err) {
      console.error("[RootPage] Server-side count fetching error:", err);
    }
  }

  return (
    <DashboardShell user={session.user} regulatoryContext={session.user.regulatoryContext ?? "saudi"} preferredLanguage={session.user.preferredLanguage ?? "en"}>
      {isEmployee && isDemo ? (
        <EmployeeCommandCenter employeeId={session.user.employeeId} />
      ) : (
        <CommandCenter userName={session.user.name ?? "HR Manager"} role={session.user.role as AppRole} dbCounts={dbCounts} />
      )}
    </DashboardShell>
  );
}

const featuredCapability: Record<string, Capability> = {
  "people-organization": "people:view_company",
  "payroll-settlement": "payroll:view_company",
  recruitment: "recruitment:view",
  "nitaqat-compliance": "compliance:manage",
  "ai-intelligence": "reports:view_company",
  "performance-goals": "performance:view_team",
};

function CommandCenter({ userName, role, dbCounts }: { userName: string; role: AppRole; dbCounts: DbCounts | null }) {
  const featuredModules = productModules.filter(
    (module) => featuredSlugs.includes(module.slug) && can(role, featuredCapability[module.slug] ?? "dashboard:view_admin"),
  );

  const activeCount = dbCounts ? dbCounts.activeCount : taazurEnergyDemo.employees.filter((employee) => employee.status === "active").length;
  const totalHeadcount = dbCounts ? dbCounts.totalHeadcount : taazurEnergyDemo.employees.length;
  const departmentCount = dbCounts ? dbCounts.departmentCount : taazurEnergyDemo.departments.length;
  const openJobsCount = dbCounts ? dbCounts.openJobsCount : taazurEnergyDemo.recruitment.requisitions.length;
  const payslipsCount = dbCounts ? dbCounts.payslipCount : taazurEnergyDemo.payroll.payslips.length;

  const metrics = [
    { label: "Active people", value: String(activeCount), delta: `${departmentCount} departments · ${taazurEnergyDemo.branches.length} branches`, icon: Users, tone: "emerald", capability: "people:view_company" as Capability },
    { label: "Payroll run", value: `SAR ${(taazurEnergyDemo.payroll.net / 1000).toFixed(0)}k`, delta: `${payslipsCount} payslips · ${taazurEnergyDemo.payroll.anomalies.length} to review`, icon: BriefcaseBusiness, tone: "amber", capability: "payroll:view_company" as Capability },
    { label: "Open positions", value: String(openJobsCount), delta: `${taazurEnergyDemo.recruitment.candidates.length} candidates · ${taazurEnergyDemo.projects.length} projects`, icon: UserPlus, tone: "blue", capability: "recruitment:view" as Capability },
    { label: "Saudization", value: `${taazurEnergyDemo.company.saudizationRate}%`, delta: `${taazurEnergyDemo.company.nitaqatBand} band · this month`, icon: ShieldCheck, tone: "violet", capability: "compliance:manage" as Capability },
  ].filter((metric) => can(role, metric.capability));

  const toneStyles: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    blue: "bg-sky-50 text-sky-800 ring-sky-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-7 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{taazurEnergyDemo.company.name}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Good morning, {userName.split(" ")[0]}.
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600 max-w-2xl">
              {totalHeadcount} active people across {taazurEnergyDemo.branches.length} branches and {departmentCount} departments.
              {dbCounts ? " Live data from Supabase." : " Fictional demo data."} Today is {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/employees/new" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900">
                <UserPlus className="h-4 w-4" /> Add employee
              </Link>
              {can(role, "payroll:run") && (
                <Link href="/payroll/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Run payroll <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              {can(role, "recruitment:view") && (
                <Link href="/recruitment/candidates/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  New candidate <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">PRD delivery</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{totalPrdFeatures}</p>
              <p className="mt-1 text-xs text-emerald-700">requirements catalogued</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Workspaces</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{productModules.length}</p>
              <p className="mt-1 text-xs text-amber-700">live & in delivery</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Payroll readiness · June 2026</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full w-[94%] rounded-full bg-emerald-600" /></div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-600">{taazurEnergyDemo.payroll.payslips.length} payslips validated</span>
                <strong className="text-emerald-800">94% ready</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} href={
              metric.label === "Active people" ? "/employees" :
              metric.label === "Payroll run" ? "/payroll" :
              metric.label === "Open positions" ? "/recruitment" :
              "/compliance"
            } className="block">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_-25px_rgba(15,23,42,.45)] hover:border-emerald-300">
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-4 ${toneStyles[metric.tone]}`}><Icon className="h-[18px] w-[18px]" /></span>
                  <TrendingUp className="h-4 w-4 text-slate-300" />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{metric.value}</p>
                <div className="mt-2 flex items-end justify-between gap-3"><p className="text-sm font-medium text-slate-700">{metric.label}</p><p className="text-right text-[11px] text-slate-400">{metric.delta}</p></div>
              </article>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Workspaces</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Run the employee lifecycle</h2></div>
            <Link href="/modules" className="hidden items-center gap-1.5 text-sm font-semibold text-emerald-800 sm:flex">All modules <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredModules.map((module, index) => (
              <Link key={module.slug} href={module.href ?? `/modules/${module.slug}`} className="group rounded-2xl border border-slate-200 bg-[#fafaf8] p-4 transition hover:border-emerald-800/30 hover:bg-emerald-50/40">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">0{index + 1}</span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 rtl-flip" /></div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-900">{module.name}</h3>
                <p className="mt-1 text-xs text-amber-700" dir="rtl">{module.nameAr}</p>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{module.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Today</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Priority queue</h2></div><CircleAlert className="h-5 w-5 text-amber-600" /></div>
          <div className="mt-6 space-y-3">
            {[
              { title: "2 documents expire this month", meta: "HSE certificate and Iqama", icon: FileCheck2, href: "/documents", capability: "documents:view_company" as Capability },
              { title: "Payroll pre-check required", meta: `June 2026 · ${taazurEnergyDemo.payroll.payslips.length} payslips`, icon: BriefcaseBusiness, href: "/payroll", capability: "payroll:view_company" as Capability },
              { title: "1 leave approval pending", meta: "Omar Al-Dossary · Personal leave", icon: CalendarClock, href: "/leave", capability: "leave:approve" as Capability },
              { title: "Saudization band review", meta: `${taazurEnergyDemo.company.saudizationRate}% · ${taazurEnergyDemo.company.nitaqatBand}`, icon: Landmark, href: "/compliance", capability: "compliance:manage" as Capability },
            ].filter((item) => can(role, item.capability)).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition hover:border-amber-300 hover:bg-amber-50/50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.meta}</p></div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-amber-700" />
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      {can(role, "compliance:manage") && (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Qiwa contract sync", value: "Aligned", icon: FileCheck2, color: "text-emerald-700", bg: "border-emerald-200 bg-emerald-50" },
            { label: "GOSI calculation", value: "Awaiting validation", icon: Building2, color: "text-sky-700", bg: "border-sky-200 bg-sky-50" },
            { label: "Mudad WPS adapter", value: "In sandbox", icon: Landmark, color: "text-amber-700", bg: "border-amber-200 bg-amber-50" },
          ].map((item) => {
            const Icon = item.icon;
            return <div key={item.label} className={`flex items-center gap-4 rounded-2xl border p-4 ${item.bg}`}><Icon className={`h-5 w-5 ${item.color}`} /><div className="flex-1"><p className="text-xs text-slate-600">{item.label}</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</p></div><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>;
          })}
        </section>
      )}
    </div>
  );
}