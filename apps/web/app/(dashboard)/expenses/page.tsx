"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Check,
  ClipboardList,
  Receipt,
  X,
  Plus,
  Wallet,
} from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  paid: "bg-sky-50 text-sky-800 ring-sky-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

const CATEGORY_LABEL: Record<string, string> = {
  travel: "Travel",
  meals: "Meals",
  accommodation: "Accommodation",
  supplies: "Supplies",
  training: "Training",
  client_entertainment: "Client entertainment",
  field_operations: "Field operations",
  other: "Other",
};

interface FormState {
  category: "travel" | "meals" | "accommodation" | "supplies" | "training" | "client_entertainment" | "field_operations" | "other";
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  receiptUrl: string;
}

const emptyForm: FormState = {
  category: "travel",
  description: "",
  amount: "",
  currency: "SAR",
  expenseDate: new Date().toISOString().slice(0, 10),
  receiptUrl: "",
};

export default function ExpensesPage() {
  const utils = api.useUtils();
  const session = api.auth.session.useQuery();
  const role = session.data?.user?.role ?? "employee";
  const isEmployee = role === "employee";
  const isManager = role === "department_manager" || role === "hr_manager" || role === "super_admin";

  // Employee sees their own; manager can switch to the approvals queue.
  const [view, setView] = useState<"mine" | "approvals" | "all">(
    isManager ? "approvals" : "mine",
  );

  const list = api.expense.list.useQuery(
    view === "approvals" && session.data?.user.employeeId
      ? { pendingFor: session.data.user.employeeId }
      : view === "all"
      ? {}
      : {},
    { enabled: !!session.data },
  );
  const summary = api.expense.summary.useQuery(undefined, { enabled: !!session.data });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const create = api.expense.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      utils.expense.list.invalidate();
      utils.expense.summary.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const approve = api.expense.approve.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      utils.expense.summary.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const cancel = api.expense.cancel.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      utils.expense.summary.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const myEmployeeId = session.data?.user?.employeeId;
  const rows = list.data ?? [];

  const totalMy = useMemo(
    () => rows.filter((r: any) => r.employeeId === myEmployeeId).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
    [rows, myEmployeeId],
  );
  const totalPendingForApproval = useMemo(
    () => rows.reduce((s: number, r: any) => s + (r.status === "pending" ? Number(r.amount || 0) : 0), 0),
    [rows],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.description.trim()) { setError("Description is required"); return; }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { setError("Amount must be a positive number"); return; }
    if (!form.expenseDate) { setError("Expense date is required"); return; }
    create.mutate({
      category: form.category,
      description: form.description.trim(),
      amount: amt,
      currency: form.currency || "SAR",
      expenseDate: form.expenseDate,
      receiptUrl: form.receiptUrl.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero + summary cards */}
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Employee lifecycle</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{isEmployee ? "My Expenses" : "Expenses & Reimbursements"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              {isEmployee
                ? "Submit a business expense. Your line manager is automatically assigned as the approver and will see your request in their approvals queue."
                : "Review and decide on team expense requests. Approved expenses are reimbursed on the next payroll run."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <Link href="/departments/organogram" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                View organogram <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            {(isEmployee || isManager) && (
              <button
                type="button"
                onClick={() => setShowForm((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" /> Submit expense
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="My expenses" value={String(summary.data?.mine ?? 0)} icon={Receipt} tone="emerald" />
          <SummaryCard label="Pending my approval" value={String(summary.data?.pendingForApproval ?? 0)} icon={ClipboardList} tone="amber" />
          <SummaryCard label="Approved this month" value={String(summary.data?.approvedThisMonth ?? 0)} icon={BadgeCheck} tone="sky" />
          <SummaryCard label="Pending payout" value={`SAR ${(totalPendingForApproval).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Wallet} tone="violet" />
        </div>
      </section>

      {/* Submit form (collapsible) */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">New expense submission</h2>
              <p className="text-sm text-slate-500">Your line manager is automatically set as the approver.</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
            {error && (
              <div className="md:col-span-2 rounded-md bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as FormState["category"] })}
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              >
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date incurred *</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Description *</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was the expense for?"
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount (SAR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Receipt URL (optional)</label>
              <input
                type="url"
                value={form.receiptUrl}
                onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                placeholder="https://…"
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={create.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
              >
                {create.isPending ? "Submitting…" : "Submit for approval"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <p className="ml-auto text-xs text-slate-400">
                Total submitted (this page): <strong className="text-slate-700">SAR {totalMy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
          </form>
        </section>
      )}

      {/* View switcher (manager only) */}
      {isManager && (
        <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => setView("approvals")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${view === "approvals" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pending my approval
          </button>
          <button
            type="button"
            onClick={() => setView("mine")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${view === "mine" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"}`}
          >
            My submissions
          </button>
          <button
            type="button"
            onClick={() => setView("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${view === "all" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"}`}
          >
            All expenses
          </button>
        </div>
      )}

      {/* Expenses list */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        {list.isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading expenses…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No expenses to show</h3>
            <p className="mt-1 text-sm text-slate-500">
              {view === "approvals"
                ? "You're all caught up. Pending approvals will appear here as employees submit them."
                : "Submit your first expense using the button above."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row: any) => {
                const isOwn = row.employeeId === myEmployeeId;
                const canApprove = isManager && row.status === "pending" && (row.approverEmployeeId === myEmployeeId || isManager);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.employee?.fullName ?? "—"}</div>
                      <div className="text-xs text-slate-500">{row.employee?.department?.name ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{CATEGORY_LABEL[row.category] ?? row.category}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="line-clamp-2 max-w-md">{row.description}</div>
                      {row.rejectionReason && (
                        <div className="mt-1 text-xs text-rose-700">Reason: {row.rejectionReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.expenseDate}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {row.currency} {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_TONE[row.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canApprove && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => approve.mutate({ id: row.id, action: "approve" })}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt("Rejection reason (required):");
                              if (!reason || !reason.trim()) return;
                              approve.mutate({ id: row.id, action: "reject", rejectionReason: reason.trim() });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      )}
                      {isOwn && (row.status === "pending" || row.status === "draft") && (
                        <button
                          type="button"
                          onClick={() => { if (confirm("Cancel this expense?")) cancel.mutate(row.id); }}
                          className="text-xs font-semibold text-slate-500 hover:text-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                      {!canApprove && !isOwn && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {!isManager && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4" />
          <div>
            <strong>How approval works:</strong> When you submit an expense, your line manager is automatically assigned as the approver.
            They review, approve, or reject the request from their dashboard. Approved expenses are paid on the next payroll run.
            You can track the status in this page at any time.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    sky: "bg-sky-50 text-sky-800 ring-sky-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-4 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
    </div>
  );
}