import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  FileBadge,
  MapPin,
  ReceiptText,
  Sparkles,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import { getDemoEmployee, taazurEnergyDemo } from "@hrms-app/demo";

export function EmployeeCommandCenter({ employeeId }: { employeeId: string }) {
  const employee = getDemoEmployee(employeeId);

  if (!employee) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-2xl font-semibold">Employee profile is not linked</h1>
        <p className="mt-2 text-sm">Ask your HR administrator to link this login to an employee record.</p>
      </section>
    );
  }

  const attendance = taazurEnergyDemo.attendance.entries.find((entry) => entry.employeeId === employee.id);
  const payslip = taazurEnergyDemo.payroll.payslips.find((item) => item.employeeId === employee.id);
  const leave = taazurEnergyDemo.leave.requests.filter((request) => request.employeeId === employee.id);
  const documents = taazurEnergyDemo.documents.filter((document) => document.employeeId === employee.id);
  const learning = taazurEnergyDemo.performance.learning.filter((item) => item.employeeId === employee.id);

  const quickActions = [
    { href: "/modules/time-leave-attendance", label: "Request leave", icon: CalendarDays },
    { href: "/expenses", label: "Submit expense", icon: ReceiptText },
    { href: "/profile", label: "My profile", icon: UserRoundCheck },
    { href: "/modules/documents-certificates", label: "My documents", icon: FileBadge },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <strong>Employee demo:</strong> only {employee.fullName}&apos;s fictional records are shown.
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">Mock data</span>
      </div>

      <section className="overflow-hidden rounded-[30px] bg-[#082e25] text-white">
        <div className="grid lg:grid-cols-[1.25fr_.75fr]">
          <div className="p-7 sm:p-9">
            <div className="flex items-center gap-4">
              {/* Local fictional illustration; no real employee photograph. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={employee.photoUrl} alt="" className="h-20 w-20 rounded-3xl border-2 border-white/15 object-cover" />
              <div>
                <p className="text-sm font-semibold text-amber-300" dir="rtl">{employee.fullNameAr}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Welcome, {employee.fullName.split(" ")[0]}</h1>
                <p className="mt-2 text-sm text-white/55">{employee.jobTitle} · {employee.employeeNumber}</p>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <Clock3 className="h-4 w-4 text-emerald-300" />
                <p className="mt-3 text-xs text-white/45">Today</p>
                <p className="mt-1 text-sm font-semibold capitalize">{attendance?.status.replace("_", " ") ?? "Not recorded"}</p>
                <p className="mt-1 text-xs text-white/45">{attendance?.checkIn ? `Checked in ${attendance.checkIn}` : "Approved absence"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <WalletCards className="h-4 w-4 text-amber-300" />
                <p className="mt-3 text-xs text-white/45">Latest net pay</p>
                <p className="mt-1 text-lg font-semibold">SAR {payslip?.net.toLocaleString() ?? "—"}</p>
                <p className="mt-1 text-xs text-white/45">{payslip?.period}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-white/[0.045] p-7 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Today&apos;s context</p>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-amber-300" /><div><p className="font-semibold">{attendance?.location}</p><p className="text-xs text-white/45">{employee.workPattern}</p></div></div>
              <div className="flex gap-3"><FileBadge className="mt-0.5 h-4 w-4 text-emerald-300" /><div><p className="font-semibold">{documents.length} personal documents</p><p className="text-xs text-white/45">{documents.filter((document) => document.status === "expiring_soon").length} needs attention</p></div></div>
              <div className="flex gap-3"><BookOpenCheck className="mt-0.5 h-4 w-4 text-sky-300" /><div><p className="font-semibold">{learning[0]?.title ?? "Learning catalog available"}</p><p className="text-xs text-white/45">{learning[0] ? `${learning[0].progress}% complete` : "Explore your development plan"}</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-700/30 hover:shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="h-4 w-4" /></span>
              <span className="flex-1 text-sm font-semibold text-slate-800">{action.label}</span>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-700" />
            </Link>
          );
        })}
      </section>

      <section>
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">My activity</p><h2 className="mt-1 text-xl font-semibold">Requests and documents</h2></div><Link href="/profile" className="text-xs font-semibold text-emerald-800">View profile</Link></div>
          <div className="mt-5 divide-y divide-slate-100">
            {leave.map((request) => <div key={request.id} className="flex items-center justify-between py-3 text-sm"><div><p className="font-semibold">{request.type}</p><p className="text-xs text-slate-400">{request.from} → {request.to}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{request.status}</span></div>)}
            {documents.slice(0, 3).map((document) => <div key={document.id} className="flex items-center justify-between py-3 text-sm"><div><p className="font-semibold">{document.name}</p><p className="text-xs text-slate-400">{document.type}</p></div><span className="text-xs font-semibold capitalize text-emerald-700">{document.status.replace("_", " ")}</span></div>)}
          </div>
        </article>
      </section>
    </div>
  );
}
