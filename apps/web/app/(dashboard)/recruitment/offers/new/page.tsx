"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import {
  Card,
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
import type { createOfferSchema } from "@hrms-app/validators";
import { offerStatusEnum } from "@hrms-app/validators";

type OfferForm = {
  applicationId: string;
  candidateId: string;
  jobRequisitionId: string;
  baseSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  bonusStructure: string;
  startDate: string;
  probationMonths: string;
  offerLetterUrl: string;
  expiresAt: string;
};

const INITIAL: OfferForm = {
  applicationId: "",
  candidateId: "",
  jobRequisitionId: "",
  baseSalary: "",
  housingAllowance: "0",
  transportAllowance: "0",
  otherAllowances: "0",
  bonusStructure: "",
  startDate: "",
  probationMonths: "3",
  offerLetterUrl: "",
  expiresAt: "",
};

export default function RecruitmentOffersNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [form, setForm] = useState<OfferForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof OfferForm, string>>>({});
  const [globalError, setGlobalError] = useState("");

  const { data: applications } = api.recruitment.application.list.useQuery(
    { pageSize: 500 } as any,
    { staleTime: 60_000 }
  );
  const { data: candidates } = api.recruitment.candidate.list.useQuery(
    { pageSize: 500 } as any,
    { staleTime: 60_000 }
  );
  const { data: jobRequisitions } = api.recruitment.jobRequisition.list.useQuery(
    { pageSize: 500 } as any,
    { staleTime: 60_000 }
  );

  const create = api.recruitment.offer.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.offer.list.invalidate();
      router.push("/recruitment/offers");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set<K extends keyof OfferForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof OfferForm, string>> = {};
    if (!form.applicationId) e.applicationId = "Application is required";
    if (!form.candidateId) e.candidateId = "Candidate is required";
    if (!form.jobRequisitionId) e.jobRequisitionId = "Job requisition is required";
    if (!form.baseSalary || isNaN(Number(form.baseSalary)) || Number(form.baseSalary) <= 0) {
      e.baseSalary = "Base salary must be a positive number";
    }
    if (form.housingAllowance && (isNaN(Number(form.housingAllowance)) || Number(form.housingAllowance) < 0)) {
      e.housingAllowance = "Must be zero or positive";
    }
    if (form.transportAllowance && (isNaN(Number(form.transportAllowance)) || Number(form.transportAllowance) < 0)) {
      e.transportAllowance = "Must be zero or positive";
    }
    if (form.otherAllowances && (isNaN(Number(form.otherAllowances)) || Number(form.otherAllowances) < 0)) {
      e.otherAllowances = "Must be zero or positive";
    }
    if (!form.startDate) e.startDate = "Start date is required";
    if (form.probationMonths && (isNaN(Number(form.probationMonths)) || Number(form.probationMonths) < 0 || Number(form.probationMonths) > 12)) {
      e.probationMonths = "Must be between 0 and 12 months";
    }
    if (form.offerLetterUrl && !/^https?:\/\/.+/.test(form.offerLetterUrl)) {
      e.offerLetterUrl = "Enter a valid URL starting with http:// or https://";
    }
    if (form.expiresAt && isNaN(Date.parse(form.expiresAt))) {
      e.expiresAt = "Enter a valid date/time";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    const totalComp =
      Number(form.baseSalary) +
      Number(form.housingAllowance || 0) +
      Number(form.transportAllowance || 0) +
      Number(form.otherAllowances || 0);

    create.mutate({
      applicationId: form.applicationId,
      candidateId: form.candidateId,
      jobRequisitionId: form.jobRequisitionId,
      baseSalary: Number(form.baseSalary),
      housingAllowance: Number(form.housingAllowance || 0),
      transportAllowance: Number(form.transportAllowance || 0),
      otherAllowances: Number(form.otherAllowances || 0),
      bonusStructure: form.bonusStructure.trim() || undefined,
      startDate: form.startDate,
      probationMonths: form.probationMonths ? Number(form.probationMonths) : 3,
      offerLetterUrl: form.offerLetterUrl.trim() || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });
  }

  // Derive application → candidate mapping from loaded applications
  const applicationMap = new Map<string, { candidateId?: string; jobRequisitionId?: string }>(
    applications?.items?.map((a: any) => [a.id, a as { candidateId?: string; jobRequisitionId?: string }]) ?? []
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/offers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Offers
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create Job Offer</CardTitle>
              <CardDescription>Extend a formal offer to a candidate for a job requisition.</CardDescription>
            </div>
          </div>
          <SaudiPalmette className="mt-3 h-3.5 w-28 text-[hsl(var(--saudi-gold))]" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">

            {globalError && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <strong>Error:</strong> {globalError}
              </div>
            )}

            {/* ── Application & Candidate ── */}
            <div className="space-y-1.5">
              <Label htmlFor="applicationId">
                Application <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.applicationId}
                onValueChange={(v) => {
                  set("applicationId", v);
                  const app = applicationMap.get(v);
                  if (app) {
                    set("candidateId", app.candidateId ?? "");
                    set("jobRequisitionId", app.jobRequisitionId ?? "");
                  }
                }}
              >
                <SelectTrigger id="applicationId" className={`w-full ${errors.applicationId ? "border-rose-400" : ""}`}>
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {applications?.items?.map((app: any) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.candidate?.firstName} {app.candidate?.lastName} — {app.jobRequisition?.title ?? "No title"} ({app.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.applicationId && <p className="text-xs text-rose-600">{errors.applicationId}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="candidateId">
                  Candidate <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={form.candidateId}
                  onValueChange={(v) => set("candidateId", v)}
                >
                  <SelectTrigger id="candidateId" className={`w-full ${errors.candidateId ? "border-rose-400" : ""}`}>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates?.items?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.candidateId && <p className="text-xs text-rose-600">{errors.candidateId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobRequisitionId">
                  Job Requisition <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={form.jobRequisitionId}
                  onValueChange={(v) => set("jobRequisitionId", v)}
                >
                  <SelectTrigger id="jobRequisitionId" className={`w-full ${errors.jobRequisitionId ? "border-rose-400" : ""}`}>
                    <SelectValue placeholder="Select job requisition" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRequisitions?.items?.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title} {j.department ? `· ${j.department.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jobRequisitionId && <p className="text-xs text-rose-600">{errors.jobRequisitionId}</p>}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* ── Compensation ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Compensation (SAR)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="baseSalary">
                    Base Salary <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    min="0"
                    step="1000"
                    value={form.baseSalary}
                    onChange={(e) => set("baseSalary", e.target.value)}
                    placeholder="90000"
                    className={errors.baseSalary ? "border-rose-400" : ""}
                  />
                  {errors.baseSalary && <p className="text-xs text-rose-600">{errors.baseSalary}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="housingAllowance">Housing Allowance</Label>
                  <Input
                    id="housingAllowance"
                    type="number"
                    min="0"
                    step="500"
                    value={form.housingAllowance}
                    onChange={(e) => set("housingAllowance", e.target.value)}
                    placeholder="0"
                    className={errors.housingAllowance ? "border-rose-400" : ""}
                  />
                  {errors.housingAllowance && <p className="text-xs text-rose-600">{errors.housingAllowance}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transportAllowance">Transport Allowance</Label>
                  <Input
                    id="transportAllowance"
                    type="number"
                    min="0"
                    step="500"
                    value={form.transportAllowance}
                    onChange={(e) => set("transportAllowance", e.target.value)}
                    placeholder="0"
                    className={errors.transportAllowance ? "border-rose-400" : ""}
                  />
                  {errors.transportAllowance && <p className="text-xs text-rose-600">{errors.transportAllowance}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otherAllowances">Other Allowances</Label>
                  <Input
                    id="otherAllowances"
                    type="number"
                    min="0"
                    step="500"
                    value={form.otherAllowances}
                    onChange={(e) => set("otherAllowances", e.target.value)}
                    placeholder="0"
                    className={errors.otherAllowances ? "border-rose-400" : ""}
                  />
                  {errors.otherAllowances && <p className="text-xs text-rose-600">{errors.otherAllowances}</p>}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* ── Offer Terms ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Offer Terms</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={errors.startDate ? "border-rose-400" : ""}
                  />
                  {errors.startDate && <p className="text-xs text-rose-600">{errors.startDate}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="probationMonths">Probation (months)</Label>
                  <Input
                    id="probationMonths"
                    type="number"
                    min="0"
                    max="12"
                    value={form.probationMonths}
                    onChange={(e) => set("probationMonths", e.target.value)}
                    placeholder="3"
                    className={errors.probationMonths ? "border-rose-400" : ""}
                  />
                  {errors.probationMonths && <p className="text-xs text-rose-600">{errors.probationMonths}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expiresAt">Offer Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)}
                    className={errors.expiresAt ? "border-rose-400" : ""}
                  />
                  {errors.expiresAt && <p className="text-xs text-rose-600">{errors.expiresAt}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="offerLetterUrl">Offer Letter URL</Label>
                  <Input
                    id="offerLetterUrl"
                    type="url"
                    value={form.offerLetterUrl}
                    onChange={(e) => set("offerLetterUrl", e.target.value)}
                    placeholder="https://..."
                    className={errors.offerLetterUrl ? "border-rose-400" : ""}
                  />
                  {errors.offerLetterUrl && <p className="text-xs text-rose-600">{errors.offerLetterUrl}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bonusStructure">Bonus / Commission Structure</Label>
                <Input
                  id="bonusStructure"
                  value={form.bonusStructure}
                  onChange={(e) => set("bonusStructure", e.target.value)}
                  placeholder="e.g. Annual performance bonus up to 15% of base"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/offers")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Offer</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
