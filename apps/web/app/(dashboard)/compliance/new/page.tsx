"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const CHECK_STATUSES = ["passed", "flagged", "blocked"] as const;

export default function ComplianceNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: payrollRuns } = api.payroll.run.list.useQuery({ pageSize: 200 });

  const [payrollRunId, setPayrollRunId] = useState("");
  const [checkType, setCheckType] = useState("");
  const [status, setStatus] = useState<string>("passed");
  const [flaggedIssues, setFlaggedIssues] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.compliance.create.useMutation({
    onSuccess: async () => {
      await utils.compliance.list.invalidate();
      router.push("/compliance");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!payrollRunId) e.payrollRunId = "Payroll run is required";
    if (!checkType.trim()) e.checkType = "Check type is required";
    if (!status) e.status = "Status is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    const issues = flaggedIssues
      ? flaggedIssues.split("\n").map((l) => l.trim()).filter(Boolean)
      : undefined;
    create.mutate({
      payrollRunId,
      checkType: checkType.trim(),
      status: status as any,
      flaggedIssues: issues,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/compliance"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Compliance
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Log Compliance Check</CardTitle>
              <CardDescription>Record the result of a payroll compliance verification.</CardDescription>
            </div>
          </div>
          <SaudiPalmette className="mt-3 h-3.5 w-28 text-[hsl(var(--saudi-gold))]" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            {globalError && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <strong>Error:</strong> {globalError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="payrollRun">
                Payroll Run <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={payrollRunId}
                onValueChange={(v) => { setPayrollRunId(v); setErrors((er) => ({ ...er, payrollRunId: "" })); }}
              >
                <SelectTrigger id="payrollRun" className={`w-full ${errors.payrollRunId ? "border-rose-400" : ""}`}>
                  <SelectValue placeholder="Select a payroll run" />
                </SelectTrigger>
                <SelectContent>
                  {payrollRuns?.items?.map((run: any) => (
                    <SelectItem key={run.id} value={run.id}>
                      {run.id} — {run.status ?? "unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payrollRunId && <p className="text-xs text-rose-600">{errors.payrollRunId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkType">
                Check Type <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="checkType"
                value={checkType}
                onChange={(e) => { setCheckType(e.target.value); setErrors((er) => ({ ...er, checkType: "" })); }}
                placeholder="e.g. Saudiisation (Nitaqat), GOSI, VAT Compliance, SADAD"
                className={errors.checkType ? "border-rose-400" : ""}
              />
              {errors.checkType && <p className="text-xs text-rose-600">{errors.checkType}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">
                Check Result <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(v) => { setStatus(v); setErrors((er) => ({ ...er, status: "" })); }}
              >
                <SelectTrigger id="status" className={`w-full ${errors.status ? "border-rose-400" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}
            </div>

            {status === "flagged" || status === "blocked" ? (
              <div className="space-y-1.5">
                <Label htmlFor="flaggedIssues">
                  Flagged Issues {status === "flagged" ? "(Optional)" : ""}
                </Label>
                <textarea
                  id="flaggedIssues"
                  value={flaggedIssues}
                  onChange={(e) => setFlaggedIssues(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--saudi-green))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter each issue on a new line"
                />
                <p className="text-xs text-slate-500">One issue per line</p>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/compliance")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Log Check</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
