import Link from "next/link";

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action && (
        <Link href={action.href} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export const selectClass = inputClass;

export function SubmitButton({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" | "danger" }) {
  const className =
    tone === "danger"
      ? "rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      : tone === "light"
        ? "rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        : "rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900";
  return (
    <button type="submit" className={className}>
      {children}
    </button>
  );
}
