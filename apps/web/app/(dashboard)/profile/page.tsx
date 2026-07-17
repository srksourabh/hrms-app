"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarCheck,
  FileBadge2,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
  WalletCards,
  TrendingUp,
  Award,
  Clock,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardContent, Badge } from "@hrms-app/ui";
import { api } from "~/trpc/react";

export default function ProfilePage() {
  const session = api.auth.session.useQuery();
  const today = api.attendance.today.useQuery();
  const monthly = api.attendance.myMonthlySummary.useQuery({
    month: new Date().toISOString().slice(0, 7),
  });

  const email = session.data?.user?.email ?? "";
  const name = session.data?.user?.name ?? "";

  // Self-service: resolve the current user's own employee row without
  // bumping into the companyProcedure gate on employee.getById.
  const employee = api.employee.me.useQuery();
  const employeeId = employee.data?.id ?? null;

  // Self-service latest payslip (server-side, single row).
  const latestPayslip = api.payroll.payslip.myLatest.useQuery();

  const payslip = useMemo(() => {
    const list = (latestPayslip.data ?? []) as any[];
    return list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  }, [latestPayslip.data]);

  // Live attendance history (calendar).
  const history = api.attendance.myHistory.useQuery(undefined, { enabled: !!employeeId });

  const initials = useMemo(() => {
    const sourceName = employee.data?.fullName ?? name ?? "?";
    return sourceName.split(" ").map((p: string) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  }, [employee.data, name]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white">
        <div className="grid gap-6 p-7 md:grid-cols-[auto_1fr_auto] md:items-center sm:p-9">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-300 text-2xl font-bold text-emerald-950 ring-2 ring-white/15">
            {initials || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">My profile</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              {employee.data?.fullName ?? name ?? "Team member"}
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {employee.data?.jobTitle ?? "—"} · {employee.data?.department?.name ?? "—"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Ownership scoped
          </span>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Net pay (latest)"
          value={payslip ? `SAR ${Number(payslip.netPay).toLocaleString()}` : "—"}
          sub={payslip?.payrollRun?.periodMonth ? `Period ${payslip.payrollRun.periodMonth.slice(0, 7)}` : "No payslip yet"}
          href="/attendance/me"
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-emerald-600" />}
          label="Today's status"
          value={today.data?.record ? (today.data.record.punchOutAt ? "Punched out" : today.data.record.punchInAt ? "Punched in" : "Scheduled") : "—"}
          sub={today.data?.assignment?.shift ? `${today.data.assignment.shift.startTime}–${today.data.assignment.shift.endTime}` : "No shift assigned"}
          href="/attendance/me"
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-emerald-600" />}
          label="This month"
          value={monthly.data ? `${monthly.data.summary.present + monthly.data.summary.remote + monthly.data.summary.onLeave} days present` : "—"}
          sub={monthly.data ? `${monthly.data.summary.late} late · ${monthly.data.summary.totalWorkedMinutes / 60 | 0}h worked` : ""}
          href="/attendance/me"
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-emerald-600" />}
          label="Leave remaining"
          value={`${monthly.data?.records ? "—" : ""}`}
          sub="See Time & leave"
          href="/leave"
        />
      </section>

      {/* Employment profile + self-service */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Employment profile</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Mail,     label: "Work email",     value: email },
                { icon: MapPin,   label: "Department",     value: employee.data?.department?.name ?? "—" },
                { icon: UserRound, label: "Hire date",      value: employee.data?.hireDate ?? "—" },
                { icon: ShieldCheck, label: "Status",       value: employee.data?.employmentStatus ?? "—" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                    <Icon className="h-4 w-4 text-emerald-700" />
                    <p className="mt-3 text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Quick actions</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/attendance/me" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <CalendarCheck className="h-5 w-5 text-emerald-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Punch in / out</p>
                <p className="text-xs text-slate-500">Record today's attendance with GPS location</p>
              </div>
            </Link>
            <Link href="/leave" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <FileBadge2 className="h-5 w-5 text-emerald-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold">File leave request</p>
                <p className="text-xs text-slate-500">Annual, sick, personal, exam leave</p>
              </div>
            </Link>
            <Link href="/attendance/me" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <WalletCards className="h-5 w-5 text-emerald-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {payslip ? `Latest payslip: SAR ${Number(payslip.netPay).toLocaleString()}` : "No payslip yet"}
                </p>
                <p className="text-xs text-slate-500">
                  {payslip?.payrollRun?.periodMonth ? `Period ${payslip.payrollRun.periodMonth.slice(0, 7)}` : "Payroll not yet generated for this account"}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Attendance calendar — last 30 days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">My attendance calendar</p>
            <p className="mt-0.5 text-xs text-slate-500">Last 30 days · punch-in/out and worked hours</p>
          </div>
          <Link href="/attendance/me" className="text-xs font-semibold text-emerald-700 hover:underline">
            Open full view →
          </Link>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <div className="py-6 text-center text-sm text-slate-500">Loading…</div>
          ) : (
            <CalendarGrid records={(history.data ?? []) as any[]} />
          )}
        </CardContent>
      </Card>

      {/* Performance snapshot */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">My performance</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
            Performance goals and review summaries appear here once your manager adds them.
            Head over to <Link href="/retention/goals" className="font-semibold text-emerald-700 hover:underline">Performance → Goals</Link> to see current objectives, or ask your manager to start a review cycle.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition hover:border-emerald-300 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            {icon}
            {label}
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
        </CardContent>
      </Card>
    </Link>
  );
}

function CalendarGrid({ records }: { records: any[] }) {
  // Build last 30 days.
  const days = useMemo(() => {
    const arr: { date: string; rec?: any }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const rec = records.find((r: any) => r.workDate === dateStr);
      arr.push({ date: dateStr, rec });
    }
    return arr;
  }, [records]);

  const STATUS_COLORS: Record<string, string> = {
    present:  "bg-emerald-500",
    late:     "bg-amber-500",
    absent:   "bg-rose-500",
    on_leave: "bg-blue-500",
    remote:   "bg-violet-500",
    half_day: "bg-orange-500",
    holiday:  "bg-slate-400",
    weekend:  "bg-slate-200",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 md:grid-cols-15">
        {days.map(({ date, rec }) => {
          const dayNum = new Date(date).getDate();
          const status = rec?.status ?? "weekend";
          const color = STATUS_COLORS[status] ?? "bg-slate-200";
          return (
            <div
              key={date}
              className={`group relative aspect-square rounded-md ${color} flex flex-col items-center justify-center text-[10px] font-semibold text-white transition hover:scale-105 hover:shadow`}
              title={`${date} · ${status}${rec?.workedMinutes ? ` · ${rec.workedMinutes}m` : ""}`}
            >
              <span>{dayNum}</span>
              {rec?.punchInAt && (
                <span className="text-[8px] opacity-80">
                  {new Date(rec.punchInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        {(Object.keys(STATUS_COLORS) as Array<keyof typeof STATUS_COLORS>).map((key) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded ${STATUS_COLORS[key]}`} />
            <span className="capitalize">{key.replace("_", " ")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
