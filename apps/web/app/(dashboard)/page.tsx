"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/trpc/react";
import {
  Users,
  Building2,
  Clock,
  UserCheck,
  TrendingUp,
  Landmark,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  Calendar,
  Briefcase,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: employees } = api.employee.list.useQuery({ pageSize: 1000 });
  const { data: departments } = api.department.list.useQuery();
  const { data: pendingLeaves } = api.leave.request.list.useQuery({ status: "pending" });

  const metrics = {
    employees: employees?.length ?? 0,
    departments: departments?.length ?? 0,
    pending: pendingLeaves?.length ?? 0,
    present: Math.floor((employees?.length ?? 0) * 0.85),
  };

  const metricCards = [
    { key: "employees", label: "Total Employees", labelAr: "إجمالي الموظفين", icon: Users, accent: "from-emerald-500 to-emerald-700", ring: "ring-emerald-200" },
    { key: "departments", label: "Active Departments", labelAr: "الأقسام النشطة", icon: Building2, accent: "from-amber-500 to-amber-700", ring: "ring-amber-200" },
    { key: "pending", label: "Pending Requests", labelAr: "الطلبات المعلقة", icon: Clock, accent: "from-rose-500 to-rose-700", ring: "ring-rose-200" },
    { key: "present", label: "Present Today", labelAr: "الحاضرون اليوم", icon: UserCheck, accent: "from-sky-500 to-sky-700", ring: "ring-sky-200" },
  ];

  const complianceCards = [
    { label: "GOSI", value: "98%", desc: "Contributions up to date" },
    { label: "Qiwa", value: "100%", desc: "Contracts registered" },
    { label: "Nitaqat", value: "Platinum", desc: "Highest Saudization band" },
    { label: "Mudad WPS", value: "On track", desc: "Last submission 3 days ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--saudi-gold))]">
            As-salāmu ʿalaykum · مرحباً
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {session?.user?.name ? `Welcome back, ${session.user.name}` : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening across your company today.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3.5 py-2 text-sm font-medium text-emerald-800">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          All systems operational
        </div>
      </header>

      {/* Metrics */}
      <section
        aria-label="Key metrics"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricCards.map((m) => {
          const Icon = m.icon;
          const value = metrics[m.key as keyof typeof metrics];
          return (
            <article
              key={m.key}
              className="saudi-card group relative overflow-hidden p-5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r" />
              <div className="flex items-start justify-between">
                <div
                  className={`rounded-xl bg-gradient-to-br ${m.accent} p-2.5 text-white shadow-sm ring-4 ${m.ring}/40`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-bold tabular-nums text-slate-900">
                  {value.toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">{m.label}</p>
              <p className="text-xs text-slate-400" dir="rtl">
                {m.labelAr}
              </p>
            </article>
          );
        })}
      </section>

      {/* Compliance strip */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 shadow-sm">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl"
        />
        <div className="relative flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 p-2 text-white shadow-sm">
            <Landmark className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Saudi Compliance Health
          </h2>
          <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Healthy
          </span>
        </div>
        <div className="relative mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {complianceCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-amber-100/80 bg-white/80 p-4 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">
                  {c.label}
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-amber-800">{c.value}</p>
              <p className="text-xs text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions + system status */}
      <section className="grid gap-6 lg:grid-cols-3">
        <article className="saudi-card col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Quick Actions
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Common tasks for HR managers
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Add Employee", labelAr: "إضافة موظف", href: "/employees/new", icon: Users },
              { label: "New Leave", labelAr: "إجازة جديدة", href: "/leave/new", icon: Calendar },
              { label: "Post Job", labelAr: "نشر وظيفة", href: "/recruitment/jobs/new", icon: Briefcase },
              { label: "Run Payroll", labelAr: "تشغيل الرواتب", href: "/payroll/new", icon: TrendingUp },
              { label: "Upload Document", labelAr: "رفع مستند", href: "/documents", icon: FileText },
              { label: "Performance", labelAr: "الأداء", href: "/retention/reviews", icon: Award },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-stone-50/60 px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                >
                  <Icon className="h-4 w-4 text-amber-700 transition group-hover:scale-110" />
                  <div className="flex-1">
                    <p>{action.label}</p>
                    <p className="text-[10px] text-slate-400" dir="rtl">
                      {action.labelAr}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-600 rtl-flip" />
                </Link>
              );
            })}
          </div>
        </article>

        <article className="saudi-card p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Today's Snapshot
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Real-time company metrics</p>
          <div className="mt-5 space-y-4">
            {[
              { label: "Turnover", value: "2.4%", trend: "down", good: true },
              { label: "Pending Approvals", value: String(metrics.pending), trend: "neutral" as const, good: false },
              { label: "Open Positions", value: "3", trend: "up", good: true },
              { label: "Avg. Tenure", value: "3.8 yr", trend: "up", good: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm text-slate-600">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {stat.value}
                  </span>
                  {stat.trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                  {stat.trend === "down" && (
                    <TrendingUp className="h-4 w-4 rotate-180 text-emerald-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
