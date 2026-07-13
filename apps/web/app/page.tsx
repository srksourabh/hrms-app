import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";
import { can, type AppRole, type Capability } from "@hrms-app/auth/rbac";
import { taazurEnergyDemo } from "@hrms-app/demo";
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
  Sparkles,
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

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const isDemo = session.user.id.startsWith("demo-");
  const isEmployee = session.user.role === "employee";

  return (
    <DashboardShell user={session.user} regulatoryContext={session.user.regulatoryContext ?? "saudi"} preferredLanguage={session.user.preferredLanguage ?? "en"}>
      {isEmployee && isDemo ? (
        <EmployeeCommandCenter employeeId={session.user.employeeId} />
      ) : (
        <CommandCenter userName={session.user.name ?? "HR Manager"} isDemo={isDemo} role={session.user.role as AppRole} />
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

function CommandCenter({ userName, isDemo, role }: { userName: string; isDemo: boolean; role: AppRole }) {
  const featuredModules = productModules.filter(
    (module) => featuredSlugs.includes(module.slug) && can(role, featuredCapability[module.slug] ?? "dashboard:view_admin"),
  );
  const metrics = (isDemo
    ? [
        { label: "Active people", value: String(taazurEnergyDemo.employees.filter((employee) => employee.status === "active").length), delta: "12 connected profiles", icon: Users, tone: "emerald", capability: "people:view_company" as Capability },
        { label: "Payroll readiness", value: `${taazurEnergyDemo.payroll.runs.length} runs`, delta: `${taazurEnergyDemo.payroll.payslips.length} payslips · ${taazurEnergyDemo.payroll.anomalies.length} fixture item to review`, icon: BriefcaseBusiness, tone: "amber", capability: "payroll:view_company" as Capability },
        { label: "Open positions", value: String(taazurEnergyDemo.recruitment.requisitions.length), delta: `${taazurEnergyDemo.recruitment.candidates.length} fictional candidate · ${taazurEnergyDemo.projects.length} projects`, icon: UserPlus, tone: "blue", capability: "recruitment:view" as Capability },
        { label: "Saudization scenario", value: `${taazurEnergyDemo.company.saudizationRate}%`, delta: `${taazurEnergyDemo.company.nitaqatBand} · ${taazurEnergyDemo.departments.length} departments`, icon: ShieldCheck, tone: "violet", capability: "compliance:manage" as Capability },
      ]
    : [
        { label: "Active people", value: "—", delta: "Connect tenant data", icon: Users, tone: "emerald", capability: "people:view_company" as Capability },
        { label: "Payroll readiness", value: "—", delta: "No active run", icon: BriefcaseBusiness, tone: "amber", capability: "payroll:view_company" as Capability },
        { label: "Open positions", value: "—", delta: "Recruitment workspace", icon: UserPlus, tone: "blue", capability: "recruitment:view" as Capability },
        { label: "Compliance controls", value: "—", delta: "Run internal check", icon: ShieldCheck, tone: "violet", capability: "compliance:manage" as Capability },
      ]).filter((metric) => can(role, metric.capability));

  const toneStyles: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    blue: "bg-sky-50 text-sky-800 ring-sky-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
  };

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /><span><strong>Operational demo:</strong> {taazurEnergyDemo.company.name} uses twelve fictional employees across Riyadh, Dhahran, and Jubail, plus four projects and three payroll history months.</span></div>
          <Link href="/modules" className="font-semibold underline underline-offset-4">View all workspaces</Link>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[30px] bg-[#071b14] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_82%_14%,rgba(245,183,48,.32),transparent_24%),radial-gradient(circle_at_12%_90%,rgba(16,185,129,.25),transparent_28%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,.04)_48%,rgba(255,255,255,.04)_49%,transparent_49%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">OPERATIONAL DEMO · Saudi workflows</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">13 July 2026</span>
            </div>
            <p className="mt-7 text-sm font-semibold text-amber-300">As-salāmu ʿalaykum · مرحباً</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Lead your workforce with clarity, {userName.split(" ")[0]}.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
              Explore payroll, talent, compliance and employee-experience workflows using fictional Saudi demo data.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/modules" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100">
                Explore all modules <Grid2X2 className="h-4 w-4" />
              </Link>
              {can(role, "payroll:run") && (
                <Link href="/payroll/new" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Start payroll <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <p className="text-xs text-white/45">Catalogued requirements</p>
              <p className="mt-2 text-3xl font-semibold">{totalPrdFeatures}</p>
              <p className="mt-1 text-xs text-emerald-200">delivery requirements</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <p className="text-xs text-white/45">Workspaces</p>
              <p className="mt-2 text-3xl font-semibold">{productModules.length}</p>
              <p className="mt-1 text-xs text-amber-200">across 5 phases</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] p-4">
              <div className="flex items-center justify-between"><span className="text-xs text-white/50">Demo readiness snapshot</span><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-400 to-amber-300" /></div>
              <div className="mt-2 flex justify-between text-xs"><span className="text-white/45">Fixture checks · no authority calls</span><strong>94 / 100 demo</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_-25px_rgba(15,23,42,.45)]">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-4 ${toneStyles[metric.tone]}`}><Icon className="h-[18px] w-[18px]" /></span>
                <TrendingUp className="h-4 w-4 text-slate-300" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{metric.value}</p>
              <div className="mt-2 flex items-end justify-between gap-3"><p className="text-sm font-medium text-slate-700">{metric.label}</p><p className="text-right text-[11px] text-slate-400">{metric.delta}</p></div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Product workspaces</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Run the employee lifecycle</h2></div>
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

        <article className="rounded-[24px] bg-[#eeeae0] p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Attention</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Priority queue</h2></div><CircleAlert className="h-5 w-5 text-amber-800" /></div>
          <div className="mt-6 space-y-3">
            {[
              { title: "2 fixture documents expire soon", meta: "HSE certificate and Iqama", icon: FileCheck2, href: "/documents", capability: "documents:view_company" as Capability },
              { title: "Demo payroll pre-check required", meta: `June 2026 · ${taazurEnergyDemo.payroll.payslips.length} payslips`, icon: BriefcaseBusiness, href: "/payroll", capability: "payroll:view_company" as Capability },
              { title: "1 leave approval pending", meta: "Omar · Personal leave", icon: CalendarClock, href: "/leave", capability: "leave:approve" as Capability },
              { title: "Nitaqat fixture scenario", meta: `${taazurEnergyDemo.company.saudizationRate}% illustrative rate · High Green fixture`, icon: Landmark, href: "/compliance", capability: "compliance:manage" as Capability },
            ].filter((item) => can(role, item.capability)).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-2xl bg-white/75 p-3.5 transition hover:bg-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.meta}</p></div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-700" />
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      {can(role, "compliance:manage") && (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Qiwa contract fixture", value: "Locally aligned", icon: FileCheck2, color: "text-emerald-700" },
            { label: "GOSI calculation", value: "Legal validation required", icon: Building2, color: "text-sky-700" },
            { label: "Mudad WPS adapter", value: "Mock only", icon: Landmark, color: "text-amber-700" },
          ].map((item) => {
            const Icon = item.icon;
            return <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"><Icon className={`h-5 w-5 ${item.color}`} /><div className="flex-1"><p className="text-xs text-slate-400">{item.label}</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</p></div><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>;
          })}
        </section>
      )}
    </div>
  );
}
