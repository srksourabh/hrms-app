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
  ShieldCheck,
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

export default function RecruitmentChecksBackgroundNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: candidates } = api.recruitment.candidate.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );
  const { data: applications } = api.recruitment.application.list.useQuery(
    { pageSize: 200 } as any,
    { staleTime: 60_000 }
  );

  const [form, setForm] = useState({
    candidateId: "",
    applicationId: "",
    provider: "",
    providerReferenceId: "",
    cost: "",
    notes: "",
  });
  const [checks, setChecks] = useState<Record<string, boolean>>({
    criminal: false,
    employment: false,
    education: false,
    identity: false,
    credit: false,
    driving: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.recruitment.backgroundCheck.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.backgroundCheck.list.invalidate();
      router.push("/recruitment/checks/background");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleCheck(key: string) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.candidateId) e.candidateId = "Candidate is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    const enabledChecks: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(checks)) {
      if (val) enabledChecks[key] = val;
    }

    create.mutate({
      candidateId: form.candidateId,
      applicationId: form.applicationId || undefined,
      provider: form.provider.trim() || undefined,
      providerReferenceId: form.providerReferenceId.trim() || undefined,
      checks: Object.keys(enabledChecks).length > 0 ? enabledChecks : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    });
  }

  const CHECK_OPTIONS = [
    { key: "criminal", label: "Criminal Record" },
    { key: "employment", label: "Employment History" },
    { key: "education", label: "Education Verification" },
    { key: "identity", label: "Identity Verification" },
    { key: "credit", label: "Credit Check" },
    { key: "driving", label: "Driving Record" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/checks/background"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Background Checks
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Initiate Background Check
              </CardTitle>
              <CardDescription>
                Start a new background check for a candidate.
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
              <Label htmlFor="applicationId">Application</Label>
              <Select
                value={form.applicationId}
                onValueChange={(v) => set("applicationId", v)}
              >
                <SelectTrigger id="applicationId" className="w-full">
                  <SelectValue placeholder="Select application (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No application —</SelectItem>
                  {applications?.items?.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.candidate?.firstName} {a.candidate?.lastName}
                      {a.jobRequisition?.title ? ` · ${a.jobRequisition.title}` : ""}
                      {a.status ? ` · ${a.status}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Link to a specific application if applicable
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="e.g. First Advantage, HireRight, Checkr"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="providerReferenceId">Provider Reference ID</Label>
              <Input
                id="providerReferenceId"
                value={form.providerReferenceId}
                onChange={(e) => set("providerReferenceId", e.target.value)}
                placeholder="External reference number from the provider"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Check Types</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
                {CHECK_OPTIONS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checks[key] ?? false}
                      onChange={() => toggleCheck(key)}
                      className="h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost (SAR)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="1"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Additional notes or instructions…"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/checks/background")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initiating…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Initiate Check</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
