"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, BarChart3, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const SURVEY_STATUSES = ["draft", "scheduled", "open", "closed", "analyzed", "action_planning", "completed"] as const;

export default function EngagementNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.retention.engagementSurvey.create.useMutation({
    onSuccess: async () => {
      await utils.retention.engagementSurvey.list.invalidate();
      router.push("/retention/engagement");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Survey name is required";
    if (!status) e.status = "Status is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      status: status as any,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isAnonymous,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/engagement"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Engagement Surveys
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create Engagement Survey</CardTitle>
              <CardDescription>Design and schedule an employee engagement survey.</CardDescription>
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
              <Label htmlFor="name">
                Survey Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: "" })); }}
                placeholder="e.g. Q3 2026 Employee Engagement Survey"
                className={errors.name ? "border-rose-400" : ""}
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the survey purpose"
              />
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
                  {SURVEY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
              />
              <Label htmlFor="isAnonymous" className="text-sm font-normal">
                This is an anonymous survey — responses cannot be traced to individuals
              </Label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/retention/engagement")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Survey</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
