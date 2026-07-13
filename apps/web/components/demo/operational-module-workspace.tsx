"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { DemoWorkflow } from "@hrms-app/demo";
import type { ProductModule } from "~/lib/module-catalog";

interface OperationalModuleWorkspaceProps {
  module: ProductModule;
  workflow: DemoWorkflow;
  userName: string;
}

interface AuditEvent {
  id: number;
  title: string;
  detail: string;
}

export function OperationalModuleWorkspace({ module, workflow, userName }: OperationalModuleWorkspaceProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initialRecords = useMemo(() => workflow.records, [workflow.records]);

  function runAction(actionId: string, label: string, result: string) {
    setRunningAction(actionId);
    setNotice(null);
    window.setTimeout(() => {
      setEvents((current) => [
        { id: Date.now(), title: label, detail: result },
        ...current,
      ]);
      setNotice(result);
      setRunningAction(null);
    }, 350);
  }

  function resetDemo() {
    setEvents([]);
    setNotice("Demo activity reset. Source fixture records were preserved.");
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] bg-[#071b14] px-6 py-8 text-white sm:px-9">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_90%_5%,rgba(245,183,48,.32),transparent_24%),radial-gradient(circle_at_10%_100%,rgba(16,185,129,.3),transparent_30%)]" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${workflow.mode === "mock" ? "border-sky-300/30 bg-sky-300/10 text-sky-200" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}>
                {workflow.mode === "mock" ? "Mock integration · no authority call" : "Operational customer demo"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55">Fictional Rukn Energy data</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-emerald-300">{module.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{workflow.title}</h1>
            <p className="mt-2 text-base text-amber-300" dir="rtl">{module.nameAr}</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">{workflow.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {module.href && (
              <Link href={module.href} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100">
                Open primary workspace <ExternalLink className="h-4 w-4" />
              </Link>
            )}
            <button type="button" onClick={resetDemo} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Reset activity <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <span>{notice}</span>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        {workflow.metrics.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Operational records</p><h2 className="mt-1 text-xl font-semibold">Current workspace queue</h2></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"><Database className="h-3.5 w-3.5" /> Connected fixture</span>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {initialRecords.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="flex items-start justify-between gap-4 py-4">
                <div><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-[#eee9dc] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Quick operations</p>
          <h2 className="mt-1 text-xl font-semibold">Complete a customer journey</h2>
          {workflow.mode === "mock" && (
            <div className="mt-4 flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Responses are deterministic simulations. No Saudi authority or bank is contacted.
            </div>
          )}
          <div className="mt-5 space-y-2">
            {workflow.actions.map((item) => (
              <button key={item.id} type="button" onClick={() => runAction(item.id, item.label, item.result)} disabled={Boolean(runningAction)} className="group flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3.5 text-left transition hover:bg-white disabled:cursor-wait disabled:opacity-60">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">{runningAction === item.id ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}</span>
                <span className="flex-1 text-sm font-semibold text-slate-900">{runningAction === item.id ? "Running demo operation…" : item.label}</span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-700" />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Included capabilities</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {module.capabilities.map((capability) => <span key={capability} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{capability}</span>)}
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Demo audit trail</p><h2 className="mt-1 text-lg font-semibold">Actions by {userName}</h2></div><span className="text-xs text-slate-400">{events.length} event{events.length === 1 ? "" : "s"}</span></div>
          <div className="mt-4 space-y-3">
            {events.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Run an operation to create an auditable demo event.</p> : events.map((event) => <div key={event.id} className="rounded-2xl border border-slate-100 p-4"><p className="text-sm font-semibold text-slate-900">{event.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p></div>)}
          </div>
        </article>
      </section>
    </div>
  );
}
