"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  Clock,
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
import { interviewTypeEnum } from "@hrms-app/validators";

type InterviewForm = {
  applicationId: string;
  type: string;
  scheduledAt: string;
  durationMinutes: string;
  location: string;
  meetingUrl: string;
  interviewerIds: string[];
};

const INITIAL: InterviewForm = {
  applicationId: "",
  type: "",
  scheduledAt: "",
  durationMinutes: "60",
  location: "",
  meetingUrl: "",
  interviewerIds: [],
};

const INTERVIEW_TYPE_OPTIONS = interviewTypeEnum.options.map((t) => ({
  value: t,
  label: t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
}));

export default function RecruitmentInterviewsNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [form, setForm] = useState<InterviewForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof InterviewForm, string>>>({});
  const [globalError, setGlobalError] = useState("");
  const [interviewerSearch, setInterviewerSearch] = useState("");

  const { data: applications } = api.recruitment.application.list.useQuery(
    { pageSize: 500 } as any,
    { staleTime: 60_000 }
  );
  const { data: employees } = api.employee.list.useQuery(
    { pageSize: 500 } as any,
    { staleTime: 60_000 }
  );

  const create = api.recruitment.interview.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.interview.list.invalidate();
      router.push("/recruitment/interviews");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function set<K extends keyof InterviewForm>(key: K, value: InterviewForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleInterviewer(id: string) {
    const current = form.interviewerIds;
    if (current.includes(id)) {
      set("interviewerIds", current.filter((x) => x !== id));
    } else {
      set("interviewerIds", [...current, id]);
    }
  }

  function validate(): boolean {
    const e: Partial<Record<keyof InterviewForm, string>> = {};
    if (!form.applicationId) e.applicationId = "Application is required";
    if (!form.type) e.type = "Interview type is required";
    if (!form.scheduledAt) e.scheduledAt = "Scheduled date and time is required";
    if (form.durationMinutes && (isNaN(Number(form.durationMinutes)) || Number(form.durationMinutes) <= 0)) {
      e.durationMinutes = "Duration must be a positive number";
    }
    if (form.meetingUrl && !/^https?:\/\/.+/.test(form.meetingUrl)) {
      e.meetingUrl = "Enter a valid URL starting with http:// or https://";
    }
    if (form.interviewerIds.length === 0) e.interviewerIds = "At least one interviewer is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    create.mutate({
      applicationId: form.applicationId,
      type: form.type as any,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      location: form.location.trim() || undefined,
      meetingUrl: form.meetingUrl.trim() || undefined,
      interviewerIds: form.interviewerIds,
    });
  }

  const filteredEmployees = employees?.items?.filter((emp: any) => {
    if (!interviewerSearch) return true;
    const q = interviewerSearch.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(q) ||
      emp.jobTitle?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recruitment/interviews"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Interviews
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Schedule Interview</CardTitle>
              <CardDescription>Book an interview for a candidate in your talent pipeline.</CardDescription>
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

            {/* ── Application & Interview Type ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="applicationId">
                  Application <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={form.applicationId}
                  onValueChange={(v) => set("applicationId", v)}
                >
                  <SelectTrigger id="applicationId" className={`w-full ${errors.applicationId ? "border-rose-400" : ""}`}>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications?.items?.map((app: any) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.candidate?.firstName} {app.candidate?.lastName} — {app.jobRequisition?.title ?? "No title"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.applicationId && <p className="text-xs text-rose-600">{errors.applicationId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type">
                  Interview Type <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v)}
                >
                  <SelectTrigger id="type" className={`w-full ${errors.type ? "border-rose-400" : ""}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* ── Schedule ── */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Clock className="h-4 w-4" />
                Schedule
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledAt">
                    Date & Time <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                    className={errors.scheduledAt ? "border-rose-400" : ""}
                  />
                  {errors.scheduledAt && <p className="text-xs text-rose-600">{errors.scheduledAt}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="15"
                    step="15"
                    value={form.durationMinutes}
                    onChange={(e) => set("durationMinutes", e.target.value)}
                    placeholder="60"
                    className={errors.durationMinutes ? "border-rose-400" : ""}
                  />
                  {errors.durationMinutes && <p className="text-xs text-rose-600">{errors.durationMinutes}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="location">
                    <MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="e.g. Building A, Floor 3, Room 302"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="meetingUrl">
                    <Video className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                    Meeting URL
                  </Label>
                  <Input
                    id="meetingUrl"
                    type="url"
                    value={form.meetingUrl}
                    onChange={(e) => set("meetingUrl", e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className={errors.meetingUrl ? "border-rose-400" : ""}
                  />
                  {errors.meetingUrl && <p className="text-xs text-rose-600">{errors.meetingUrl}</p>}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* ── Interviewers ── */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <CalendarCheck className="h-4 w-4" />
                Interviewers <span className="text-rose-500">*</span>
              </h3>

              <div className="space-y-1.5">
                <Input
                  placeholder="Search employees by name, title, or email…"
                  value={interviewerSearch}
                  onChange={(e) => setInterviewerSearch(e.target.value)}
                />
              </div>

              {errors.interviewerIds && (
                <p className="text-xs text-rose-600">{errors.interviewerIds}</p>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-slate-200 p-3">
                {filteredEmployees && filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: any) => {
                    const selected = form.interviewerIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-slate-50 ${selected ? "bg-emerald-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleInterviewer(emp.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{emp.fullName}</span>
                          {emp.jobTitle && (
                            <span className="ml-1.5 text-slate-500">· {emp.jobTitle}</span>
                          )}
                        </span>
                        {emp.department?.name && (
                          <span className="text-xs text-slate-400">{emp.department.name}</span>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-slate-400">
                    {interviewerSearch ? "No employees match your search" : "No employees available"}
                  </p>
                )}
              </div>

              {form.interviewerIds.length > 0 && (
                <p className="text-xs text-slate-500">
                  {form.interviewerIds.length} interviewer{form.interviewerIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/interviews")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Schedule Interview</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
