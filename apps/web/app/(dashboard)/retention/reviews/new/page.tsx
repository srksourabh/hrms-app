"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, ClipboardCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const REVIEW_TYPES = ["annual", "mid_year", "probation", "project", "360"] as const;
const REVIEW_STATUSES = ["pending", "in_progress", "submitted", "acknowledged", "completed"] as const;

export default function ReviewsNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: employees } = api.employee.list.useQuery({ pageSize: 200 } as any, { staleTime: 60_000 });
  const { data: reviewCycles } = api.retention.reviewCycle.list.useQuery({ pageSize: 200 });

  const [reviewCycleId, setReviewCycleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [type, setType] = useState<string>("annual");
  const [status, setStatus] = useState<string>("pending");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.retention.review.create.useMutation({
    onSuccess: async () => {
      await utils.retention.review.list.invalidate();
      router.push("/retention/reviews");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!reviewCycleId) e.reviewCycleId = "Review cycle is required";
    if (!employeeId) e.employeeId = "Employee is required";
    if (!type) e.type = "Review type is required";
    if (!status) e.status = "Status is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      reviewCycleId,
      employeeId,
      managerId: managerId || undefined,
      type: type as any,
      status: status as any,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/reviews"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Reviews
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create Review</CardTitle>
              <CardDescription>Assign a performance review to an employee within a review cycle.</CardDescription>
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
              <Label htmlFor="cycle">
                Review Cycle <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={reviewCycleId}
                onValueChange={(v) => { setReviewCycleId(v); setErrors((er) => ({ ...er, reviewCycleId: "" })); }}
              >
                <SelectTrigger id="cycle" className={`w-full ${errors.reviewCycleId ? "border-rose-400" : ""}`}>
                  <SelectValue placeholder="Select a review cycle" />
                </SelectTrigger>
                <SelectContent>
                  {reviewCycles?.items?.map((cycle: any) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} ({cycle.type}) — {cycle.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reviewCycleId && <p className="text-xs text-rose-600">{errors.reviewCycleId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={employeeId}
                onValueChange={(v) => { setEmployeeId(v); setErrors((er) => ({ ...er, employeeId: "" })); }}
              >
                <SelectTrigger id="employee" className={`w-full ${errors.employeeId ? "border-rose-400" : ""}`}>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.jobTitle ? `· ${emp.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && <p className="text-xs text-rose-600">{errors.employeeId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manager">Manager</Label>
              <Select
                value={managerId}
                onValueChange={(v) => setManagerId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="manager" className="w-full">
                  <SelectValue placeholder="Select a manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No manager assigned —</SelectItem>
                  {employees?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.jobTitle ? `· ${emp.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">
                  Review Type <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => { setType(v); setErrors((er) => ({ ...er, type: "" })); }}
                >
                  <SelectTrigger id="type" className={`w-full ${errors.type ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">
                  Status <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => { setStatus(v); setErrors((er) => ({ ...er, status: "" })); }}
                >
                  <SelectTrigger id="status" className={`w-full ${errors.status ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/retention/reviews")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Review</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
