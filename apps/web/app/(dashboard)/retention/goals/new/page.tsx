"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Target, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const GOAL_TYPES = ["okr", "kpi", "project", "development", "behavioral"] as const;
const GOAL_STATUSES = ["draft", "active", "on_track", "at_risk", "off_track", "completed", "cancelled"] as const;

export default function GoalsNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: employees } = api.employee.list.useQuery({ pageSize: 200 } as any, { staleTime: 60_000 });
  const { data: managers } = api.employee.list.useQuery({ pageSize: 200 } as any, { staleTime: 60_000 });

  const [employeeId, setEmployeeId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("okr");
  const [status, setStatus] = useState<string>("draft");
  const [weight, setWeight] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.retention.goal.create.useMutation({
    onSuccess: async () => {
      await utils.retention.goal.list.invalidate();
      router.push("/retention/goals");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!employeeId) e.employeeId = "Employee is required";
    if (!title.trim()) e.title = "Goal title is required";
    if (!type) e.type = "Goal type is required";
    if (!status) e.status = "Status is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "End date is required";
    if (startDate && endDate && startDate > endDate) e.endDate = "End date must be after start date";
    const p = Number(progress);
    if (isNaN(p) || p < 0 || p > 100) e.progress = "Progress must be between 0 and 100";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      employeeId,
      managerId: managerId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      type: type as any,
      status: status as any,
      weight: weight ? Number(weight) : undefined,
      startDate,
      endDate,
      progress: Number(progress),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/goals"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Goals
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create New Goal</CardTitle>
              <CardDescription>Set a performance or development goal for an employee.</CardDescription>
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
              <Label htmlFor="employee">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setErrors((er) => ({ ...er, employeeId: "" })); }}>
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
              <Label htmlFor="title">
                Goal Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: "" })); }}
                placeholder="e.g. Increase Q3 sales by 20%, Complete AWS certification"
                className={errors.title ? "border-rose-400" : ""}
              />
              {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the goal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">
                  Type <span className="text-rose-500">*</span>
                </Label>
                <Select value={type} onValueChange={(v) => { setType(v); setErrors((er) => ({ ...er, type: "" })); }}>
                  <SelectTrigger id="type" className={`w-full ${errors.type ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">
                  Status <span className="text-rose-500">*</span>
                </Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setErrors((er) => ({ ...er, status: "" })); }}>
                  <SelectTrigger id="status" className={`w-full ${errors.status ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">
                  Start Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setErrors((er) => ({ ...er, startDate: "" })); }}
                  className={errors.startDate ? "border-rose-400" : ""}
                />
                {errors.startDate && <p className="text-xs text-rose-600">{errors.startDate}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate">
                  End Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setErrors((er) => ({ ...er, endDate: "" })); }}
                  className={errors.endDate ? "border-rose-400" : ""}
                />
                {errors.endDate && <p className="text-xs text-rose-600">{errors.endDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="progress">
                  Progress (%) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => { setProgress(e.target.value); setErrors((er) => ({ ...er, progress: "" })); }}
                  placeholder="0"
                  className={errors.progress ? "border-rose-400" : ""}
                />
                {errors.progress && <p className="text-xs text-rose-600">{errors.progress}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Optional, for weighting in reviews"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manager">Manager / Reviewer</Label>
              <Select value={managerId} onValueChange={(v) => setManagerId(v === "__none__" ? "" : v)}>
                <SelectTrigger id="manager" className="w-full">
                  <SelectValue placeholder="Select a manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No manager assigned —</SelectItem>
                  {managers?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.jobTitle ? `· ${emp.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/retention/goals")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Goal</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
