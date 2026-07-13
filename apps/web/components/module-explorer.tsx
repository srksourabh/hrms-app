"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  moduleStatusLabels,
  productModules,
  totalPrdFeatures,
  type ModuleStatus,
} from "~/lib/module-catalog";

const statusStyles: Record<ModuleStatus, string> = {
  live: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  demo: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  mock: "border-sky-300/25 bg-sky-300/10 text-sky-100",
};

const phaseLabels: Record<number, string> = {
  1: "Core HR",
  2: "Talent",
  3: "Saudi services",
  4: "Experience",
  5: "Platform",
};

export function ModuleExplorer() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<number | "all">("all");

  const modules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return productModules.filter((module) => {
      const matchesPhase = phase === "all" || module.phase === phase;
      const matchesQuery =
        !needle ||
        [module.name, module.nameAr, module.eyebrow, module.description, ...module.capabilities]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesPhase && matchesQuery;
    });
  }, [phase, query]);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-[#071b14] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_15%_20%,rgba(34,197,94,.4),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(245,183,48,.28),transparent_24%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.04)_45%,rgba(255,255,255,.04)_46%,transparent_46%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Operational product workspaces
            </div>
            <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
              Every HR capability. One operating system.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
              Run every customer-demo workflow from one place. Live product routes, interactive demo operations, and simulated authority adapters are clearly distinguished.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-3xl font-semibold tracking-tight">{productModules.length}</p>
              <p className="mt-1 text-xs text-white/55">Workspaces</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-3xl font-semibold tracking-tight">{totalPrdFeatures}</p>
              <p className="mt-1 text-xs text-white/55">Connected capabilities</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search modules</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search payroll, Qiwa, surveys, workflows…"
            className="h-11 w-full rounded-xl border-0 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-700"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {["all", 1, 2, 3, 4, 5].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPhase(item as number | "all")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                phase === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item === "all" ? "All workspaces" : phaseLabels[item as number]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module, index) => (
          <Link
            key={module.slug}
            href={`/modules/${module.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-800/30 hover:shadow-[0_20px_50px_-24px_rgba(5,70,48,.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                module.status === "live"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : module.status === "demo"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-sky-200 bg-sky-50 text-sky-700"
              }`}>
                {moduleStatusLabels[module.status]}
              </span>
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {module.eyebrow} · {phaseLabels[module.phase]}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950">
              {module.name}
            </h2>
            <p className="mt-1 text-sm text-amber-700" dir="rtl">{module.nameAr}</p>
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{module.description}</p>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-400">
                {module.capabilities.length} connected capabilities
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
            </div>
          </Link>
        ))}
      </section>

      {modules.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Layers3 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No module matches this search.</p>
          <button type="button" onClick={() => { setQuery(""); setPhase("all"); }} className="mt-3 text-sm font-semibold text-emerald-700">
            Reset filters
          </button>
        </div>
      )}

      <section className="grid gap-3 rounded-2xl bg-slate-950 p-5 text-white sm:grid-cols-3">
        {(["live", "demo", "mock"] as ModuleStatus[]).map((status) => {
          const count = productModules.filter((module) => module.status === status).length;
          const Icon = status === "live" ? CheckCircle2 : status === "demo" ? Sparkles : ShieldCheck;
          return (
            <div key={status} className={`rounded-xl border p-4 ${statusStyles[status]}`}>
              <Icon className="h-5 w-5" />
              <p className="mt-3 text-2xl font-semibold">{count}</p>
              <p className="text-xs opacity-75">{moduleStatusLabels[status]}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
