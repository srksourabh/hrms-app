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
  Users,
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

export default function RecruitmentReferralsNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: employees } = api.employee.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );
  const { data: candidates } = api.recruitment.candidate.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );
  const { data: jobRequisitions } = api.recruitment.jobRequisition.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );

  const [form, setForm] = useState({
    referrerEmployeeId: "",
    candidateId: "",
    jobRequisitionId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.recruitment.referral.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.referral.list.invalidate();
      router.push("/recruitment/referrals");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.referrerEmployeeId) e.referrerEmployeeId = "Referrer is required";
    if (!form.candidateId) e.candidateId = "Candidate is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      referrerEmployeeId: form.referrerEmployeeId,
      candidateId: form.candidateId,
      jobRequisitionId: form.jobRequisitionId || undefined,
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/referrals"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Referrals
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Submit Employee Referral
              </CardTitle>
              <CardDescription>
                Refer a candidate through an employee referral programme.
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
              <Label htmlFor="referrerEmployeeId">
                Referring Employee <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.referrerEmployeeId}
                onValueChange={(v) => set("referrerEmployeeId", v)}
              >
                <SelectTrigger
                  id="referrerEmployeeId"
                  className={`w-full ${errors.referrerEmployeeId ? "border-rose-400" : ""}`}
                >
                  <SelectValue placeholder="Select referring employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                      {emp.jobTitle ? ` · ${emp.jobTitle}` : ""}
                      {emp.department?.name ? ` · ${emp.department.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.referrerEmployeeId && (
                <p className="text-xs text-rose-600">{errors.referrerEmployeeId}</p>
              )}
              <p className="text-xs text-slate-500">
                The employee submitting this referral (referrer bonus eligibility)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="candidateId">
                Candidate <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.candidateId}
                onValueChange={(v) => set("candidateId", v)}
              >
                <SelectTrigger
                  id="candidateId"
                  className={`w-full ${errors.candidateId ? "border-rose-400" : ""}`}
                >
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates?.items?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.email ? ` · ${c.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.candidateId && (
                <p className="text-xs text-rose-600">{errors.candidateId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobRequisitionId">Job Requisition</Label>
              <Select
                value={form.jobRequisitionId}
                onValueChange={(v) => set("jobRequisitionId", v)}
              >
                <SelectTrigger id="jobRequisitionId" className="w-full">
                  <SelectValue placeholder="Select job requisition (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No specific requisition —</SelectItem>
                  {jobRequisitions?.items?.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                      {j.department?.name ? ` · ${j.department.name}` : ""}
                      {j.status ? ` · ${j.status}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Optionally link this referral to a specific job opening
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional context about this referral…"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/referrals")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit Referral</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
