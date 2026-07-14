"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@hrms-app/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

export default function RecruitmentOnboardingNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: employees } = api.employee.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );

  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    dayNumber: "",
    assignedToId: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.recruitment.onboardingPlan.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.onboardingPlan.list.invalidate();
      router.push("/recruitment/onboarding");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.employeeId) e.employeeId = "Employee is required";
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.dayNumber.trim()) {
      e.dayNumber = "Day number is required";
    } else if (isNaN(Number(form.dayNumber)) || Number(form.dayNumber) <= 0) {
      e.dayNumber = "Day number must be a positive integer";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      employeeId: form.employeeId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dayNumber: Number(form.dayNumber),
      assignedToId: form.assignedToId || undefined,
      dueDate: form.dueDate || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/onboarding"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Onboarding
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Add Onboarding Task
              </CardTitle>
              <CardDescription>
                Create a new onboarding task for an employee.
              </CardDescription>
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
              <Label htmlFor="employeeId">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => set("employeeId", v)}
              >
                <SelectTrigger
                  id="employeeId"
                  className={`w-full ${errors.employeeId ? "border-rose-400" : ""}`}
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                      {emp.jobTitle ? ` · ${emp.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && (
                <p className="text-xs text-rose-600">{errors.employeeId}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Task Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. IT equipment setup"
                  className={errors.title ? "border-rose-400" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-rose-600">{errors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dayNumber">
                  Day Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="dayNumber"
                  type="number"
                  min="1"
                  value={form.dayNumber}
                  onChange={(e) => set("dayNumber", e.target.value)}
                  placeholder="e.g. 1, 7, 30"
                  className={errors.dayNumber ? "border-rose-400" : ""}
                />
                {errors.dayNumber && (
                  <p className="text-xs text-rose-600">{errors.dayNumber}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief description of the onboarding task"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assignedToId">Assigned To</Label>
                <Select
                  value={form.assignedToId}
                  onValueChange={(v) => set("assignedToId", v)}
                >
                  <SelectTrigger id="assignedToId" className="w-full">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Unassigned —</SelectItem>
                    {employees?.items?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                        {emp.jobTitle ? ` · ${emp.jobTitle}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/onboarding")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Task</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
