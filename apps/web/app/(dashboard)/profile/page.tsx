import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, FileBadge2, Mail, MapPin, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { auth } from "@hrms-app/auth";
import { getDemoEmployee, taazurEnergyDemo } from "@hrms-app/demo";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employee = getDemoEmployee(session.user.employeeId);
  const payslip = employee
    ? taazurEnergyDemo.payroll.payslips.find((item) => item.employeeId === employee.id)
    : undefined;
  const documents = employee
    ? taazurEnergyDemo.documents.filter((item) => item.employeeId === employee.id)
    : [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] bg-[#082e25] text-white">
        <div className="grid gap-6 p-7 md:grid-cols-[auto_1fr_auto] md:items-center sm:p-9">
          {employee ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.photoUrl} alt="" className="h-24 w-24 rounded-[28px] border-2 border-white/15 object-cover" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/10"><UserRound className="h-10 w-10" /></span>
          )}
          <div>
            <p className="text-sm font-semibold text-amber-300" dir="rtl">{employee?.fullNameAr ?? "ملفي الشخصي"}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{employee?.fullName ?? session.user.name ?? "My profile"}</h1>
            <p className="mt-2 text-sm text-white/55">{employee ? `${employee.jobTitle} · ${employee.employeeNumber}` : session.user.email}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"><ShieldCheck className="h-4 w-4" /> Ownership scoped</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Employment profile</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Mail, label: "Work email", value: employee?.email ?? session.user.email ?? "—" },
              { icon: MapPin, label: "Work location", value: employee?.workPattern ?? "Tenant workspace" },
              { icon: UserRound, label: "Department", value: employee?.department ?? "—" },
              { icon: ShieldCheck, label: "Identity", value: employee?.maskedIdentity ?? "Managed by HR" },
            ].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl bg-slate-50 p-4"><Icon className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-xs text-slate-400">{item.label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p></div>; })}
          </div>
          {employee && <div className="mt-5"><p className="text-xs font-semibold text-slate-400">Verified skills</p><div className="mt-2 flex flex-wrap gap-2">{employee.skills.map((skill) => <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{skill}</span>)}</div></div>}
        </article>

        <article className="rounded-3xl bg-[#eee9dc] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Personal records</p>
          <h2 className="mt-1 text-xl font-semibold">Self-service snapshot</h2>
          <div className="mt-5 space-y-3">
            <Link href="/modules/time-leave-attendance" className="flex items-center gap-3 rounded-2xl bg-white/80 p-4"><CalendarCheck className="h-5 w-5 text-emerald-700" /><div className="flex-1"><p className="text-sm font-semibold">Leave & attendance</p><p className="text-xs text-slate-500">Personal requests and today&apos;s status</p></div></Link>
            <Link href="/modules/documents-certificates" className="flex items-center gap-3 rounded-2xl bg-white/80 p-4"><FileBadge2 className="h-5 w-5 text-emerald-700" /><div className="flex-1"><p className="text-sm font-semibold">{documents.length} personal documents</p><p className="text-xs text-slate-500">Contracts, identity, and certificates</p></div></Link>
            <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4"><WalletCards className="h-5 w-5 text-emerald-700" /><div className="flex-1"><p className="text-sm font-semibold">SAR {payslip?.net.toLocaleString() ?? "—"}</p><p className="text-xs text-slate-500">Latest net pay · {payslip?.period ?? "No payslip"}</p></div></div>
          </div>
        </article>
      </section>

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Demo disclosure: this profile and all linked records are fictional. Production profiles are loaded from the authenticated tenant schema.</p>
    </div>
  );
}
