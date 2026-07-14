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
  UserCheck,
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

export default function RecruitmentChecksReferenceNewPage() {
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
    refereeName: "",
    refereeTitle: "",
    refereeCompany: "",
    refereeEmail: "",
    refereePhone: "",
    relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.recruitment.referenceCheck.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.referenceCheck.list.invalidate();
      router.push("/recruitment/checks/reference");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.candidateId) e.candidateId = "Candidate is required";
    if (!form.refereeName.trim()) e.refereeName = "Referee name is required";
    if (form.refereeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.refereeEmail)) {
      e.refereeEmail = "Enter a valid email address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    create.mutate({
      candidateId: form.candidateId,
      applicationId: form.applicationId || undefined,
      refereeName: form.refereeName.trim(),
      refereeTitle: form.refereeTitle.trim() || undefined,
      refereeCompany: form.refereeCompany.trim() || undefined,
      refereeEmail: form.refereeEmail.trim() || undefined,
      refereePhone: form.refereePhone.trim() || undefined,
      relationship: form.relationship.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/checks/reference"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Reference Checks
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Add Reference Check
              </CardTitle>
              <CardDescription>
                Collect a professional reference for a candidate.
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
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Referee Information
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refereeName">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="refereeName"
                    value={form.refereeName}
                    onChange={(e) => set("refereeName", e.target.value)}
                    placeholder="e.g. Dr. Khalid Al-Othman"
                    className={errors.refereeName ? "border-rose-400" : ""}
                  />
                  {errors.refereeName && (
                    <p className="text-xs text-rose-600">{errors.refereeName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="refereeTitle">Job Title</Label>
                  <Input
                    id="refereeTitle"
                    value={form.refereeTitle}
                    onChange={(e) => set("refereeTitle", e.target.value)}
                    placeholder="e.g. Senior Engineering Manager"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refereeCompany">Company / Organisation</Label>
                  <Input
                    id="refereeCompany"
                    value={form.refereeCompany}
                    onChange={(e) => set("refereeCompany", e.target.value)}
                    placeholder="e.g. Saudi Aramco, King Faisal Specialist Hospital"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="relationship">Relationship to Candidate</Label>
                  <Input
                    id="relationship"
                    value={form.relationship}
                    onChange={(e) => set("relationship", e.target.value)}
                    placeholder="e.g. Direct supervisor, Project lead, Colleague"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refereeEmail">Email Address</Label>
                  <Input
                    id="refereeEmail"
                    type="email"
                    value={form.refereeEmail}
                    onChange={(e) => set("refereeEmail", e.target.value)}
                    placeholder="khalid@company.com.sa"
                    className={errors.refereeEmail ? "border-rose-400" : ""}
                  />
                  {errors.refereeEmail && (
                    <p className="text-xs text-rose-600">{errors.refereeEmail}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="refereePhone">Phone Number</Label>
                  <Input
                    id="refereePhone"
                    type="tel"
                    value={form.refereePhone}
                    onChange={(e) => set("refereePhone", e.target.value)}
                    placeholder="+966 50 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/checks/reference")}
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
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Reference Check</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
