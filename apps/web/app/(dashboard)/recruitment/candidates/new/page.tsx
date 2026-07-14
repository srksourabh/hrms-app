"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Briefcase,
  Globe,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
} from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Badge } from "@hrms-app/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hrms-app/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const SOURCE_OPTIONS = [
  { value: "direct", label: "Direct Application" },
  { value: "referral", label: "Employee Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "company_website", label: "Company Website" },
  { value: "recruitment_agency", label: "Recruitment Agency" },
  { value: "university", label: "University Partnership" },
  { value: "social_media", label: "Social Media" },
  { value: "other", label: "Other" },
];

const CURRENCY_OPTIONS = ["SAR", "USD", "EUR", "AED", "KWD", "BHD", "GBP"];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  currentTitle: string;
  currentCompany: string;
  yearsExperience: string;
  noticePeriodDays: string;
  expectedSalary: string;
  currency: string;
  source: string;
  sourceDetails: string;
  resumeUrl: string;
  skills: string[];
  languages: string[];
  availability: string;
  willingToRelocate: boolean;
  preferredLocations: string[];
  tags: string[];
  notes: string;
  gdprConsent: boolean;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  portfolioUrl: "",
  currentTitle: "",
  currentCompany: "",
  yearsExperience: "",
  noticePeriodDays: "",
  expectedSalary: "",
  currency: "SAR",
  source: "direct",
  sourceDetails: "",
  resumeUrl: "",
  skills: [],
  languages: [],
  availability: "",
  willingToRelocate: false,
  preferredLocations: [],
  tags: [],
  notes: "",
  gdprConsent: false,
};

function TagsInput({
  values,
  onChange,
  placeholder,
  label,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  label: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecruitmentCandidatesNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.recruitment.candidate.create.useMutation({
    onSuccess: async () => {
      await utils.recruitment.candidate.list.invalidate();
      router.push("/recruitment/candidates?created=true");
    },
    onError: (err) => {
      setGlobalError(err.message);
    },
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleArray<K extends "skills" | "languages" | "preferredLocations" | "tags">(
    key: K,
    item: string
  ) {
    const arr = form[key] as string[];
    if (arr.includes(item)) {
      set(key, arr.filter((x) => x !== item) as any);
    } else {
      set(key, [...arr, item] as any);
    }
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }
    if (form.linkedinUrl && !/^https?:\/\/.+/.test(form.linkedinUrl)) {
      e.linkedinUrl = "Enter a valid URL starting with http:// or https://";
    }
    if (form.portfolioUrl && !/^https?:\/\/.+/.test(form.portfolioUrl)) {
      e.portfolioUrl = "Enter a valid URL starting with http:// or https://";
    }
    if (form.resumeUrl && !/^https?:\/\/.+/.test(form.resumeUrl)) {
      e.resumeUrl = "Enter a valid URL starting with http:// or https://";
    }
    if (form.yearsExperience && (isNaN(Number(form.yearsExperience)) || Number(form.yearsExperience) < 0)) {
      e.yearsExperience = "Must be a positive number";
    }
    if (form.noticePeriodDays && (isNaN(Number(form.noticePeriodDays)) || Number(form.noticePeriodDays) < 0)) {
      e.noticePeriodDays = "Must be a positive number";
    }
    if (form.expectedSalary && (isNaN(Number(form.expectedSalary)) || Number(form.expectedSalary) <= 0)) {
      e.expectedSalary = "Must be a positive number";
    }
    if (!form.gdprConsent) {
      e.gdprConsent = "GDPR consent is required to store candidate data";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    create.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      portfolioUrl: form.portfolioUrl.trim() || undefined,
      currentTitle: form.currentTitle.trim() || undefined,
      currentCompany: form.currentCompany.trim() || undefined,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
      noticePeriodDays: form.noticePeriodDays ? Number(form.noticePeriodDays) : undefined,
      expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
      currency: form.currency as any,
      source: form.source as any,
      sourceDetails: form.sourceDetails.trim() || undefined,
      resumeUrl: form.resumeUrl.trim() || undefined,
      skills: form.skills.length ? form.skills : undefined,
      languages: form.languages.length ? form.languages : undefined,
      availability: form.availability.trim() || undefined,
      willingToRelocate: form.willingToRelocate,
      preferredLocations: form.preferredLocations.length ? form.preferredLocations : undefined,
      tags: form.tags.length ? form.tags : undefined,
      notes: form.notes.trim() || undefined,
      gdprConsent: form.gdprConsent,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/recruitment/candidates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Candidates
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Add New Candidate
              </CardTitle>
              <CardDescription>
                Create a candidate profile and add them to your talent pipeline.
              </CardDescription>
            </div>
          </div>
          <SaudiPalmette className="mt-3 h-3.5 w-28 text-[hsl(var(--saudi-gold))]" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-6">

            {/* ── Global error ── */}
            {globalError && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <strong>Submission failed:</strong> {globalError}
                </div>
              </div>
            )}

            {/* ── Personal Information ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">
                    First Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Ahmed"
                    className={errors.firstName ? "border-rose-400" : ""}
                  />
                  {errors.firstName && <p className="text-xs text-rose-600">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Al-Mutairi"
                    className={errors.lastName ? "border-rose-400" : ""}
                  />
                  {errors.lastName && <p className="text-xs text-rose-600">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    <Mail className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                    Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="ahmed@example.com"
                    className={errors.email ? "border-rose-400" : ""}
                  />
                  {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+966 50 123 4567"
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Professional ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Briefcase className="h-4 w-4" />
                Professional
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currentTitle">Current Title</Label>
                  <Input
                    id="currentTitle"
                    value={form.currentTitle}
                    onChange={(e) => set("currentTitle", e.target.value)}
                    placeholder="Senior Project Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input
                    id="currentCompany"
                    value={form.currentCompany}
                    onChange={(e) => set("currentCompany", e.target.value)}
                    placeholder="Saudi Aramco"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    value={form.yearsExperience}
                    onChange={(e) => set("yearsExperience", e.target.value)}
                    placeholder="7"
                    className={errors.yearsExperience ? "border-rose-400" : ""}
                  />
                  {errors.yearsExperience && <p className="text-xs text-rose-600">{errors.yearsExperience}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noticePeriodDays">Notice Period (days)</Label>
                  <Input
                    id="noticePeriodDays"
                    type="number"
                    min="0"
                    value={form.noticePeriodDays}
                    onChange={(e) => set("noticePeriodDays", e.target.value)}
                    placeholder="30"
                    className={errors.noticePeriodDays ? "border-rose-400" : ""}
                  />
                  {errors.noticePeriodDays && <p className="text-xs text-rose-600">{errors.noticePeriodDays}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expectedSalary">Expected Salary</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expectedSalary"
                      type="number"
                      min="0"
                      value={form.expectedSalary}
                      onChange={(e) => set("expectedSalary", e.target.value)}
                      placeholder="12000"
                      className={`flex-1 ${errors.expectedSalary ? "border-rose-400" : ""}`}
                    />
                    <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                      <SelectTrigger className="w-20 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.expectedSalary && <p className="text-xs text-rose-600">{errors.expectedSalary}</p>}
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Source ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Globe className="h-4 w-4" />
                Source & Channels
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => set("source", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sourceDetails">Source Details</Label>
                  <Input
                    id="sourceDetails"
                    value={form.sourceDetails}
                    onChange={(e) => set("sourceDetails", e.target.value)}
                    placeholder="e.g. LinkedIn Recruiter, Indeed ad link"
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Online Presence ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Globe className="h-4 w-4" />
                Online Presence
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={form.linkedinUrl}
                    onChange={(e) => set("linkedinUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/ahmed-almutairi"
                    className={errors.linkedinUrl ? "border-rose-400" : ""}
                  />
                  {errors.linkedinUrl && <p className="text-xs text-rose-600">{errors.linkedinUrl}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portfolioUrl">Portfolio / Website URL</Label>
                  <Input
                    id="portfolioUrl"
                    value={form.portfolioUrl}
                    onChange={(e) => set("portfolioUrl", e.target.value)}
                    placeholder="https://ahmed.dev"
                    className={errors.portfolioUrl ? "border-rose-400" : ""}
                  />
                  {errors.portfolioUrl && <p className="text-xs text-rose-600">{errors.portfolioUrl}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="resumeUrl">
                    <FileText className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                    Resume / CV URL
                  </Label>
                  <Input
                    id="resumeUrl"
                    value={form.resumeUrl}
                    onChange={(e) => set("resumeUrl", e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className={errors.resumeUrl ? "border-rose-400" : ""}
                  />
                  {errors.resumeUrl && <p className="text-xs text-rose-600">{errors.resumeUrl}</p>}
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Skills & Languages ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Skills & Languages
              </h3>
              <TagsInput
                label="Skills (press Enter or comma to add)"
                values={form.skills}
                onChange={(v) => set("skills", v)}
                placeholder="e.g. Project Management, AutoCAD, PMP"
              />
              <TagsInput
                label="Languages (press Enter or comma to add)"
                values={form.languages}
                onChange={(v) => set("languages", v)}
                placeholder="e.g. Arabic, English, Hindi"
              />
            </section>

            <hr className="border-slate-100" />

            {/* ── Availability ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Availability & Location
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    value={form.availability}
                    onChange={(e) => set("availability", e.target.value)}
                    placeholder="e.g. Immediately, 2 weeks notice, 1 month"
                  />
                </div>
                <div className="space-y-1.5">
                  <TagsInput
                    label="Preferred Locations"
                    values={form.preferredLocations}
                    onChange={(v) => set("preferredLocations", v)}
                    placeholder="e.g. Riyadh, Jeddah, Remote"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={form.willingToRelocate}
                  onChange={(e) => set("willingToRelocate", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
                />
                <span className="text-sm text-slate-700">Willing to relocate for the role</span>
              </label>
            </section>

            <hr className="border-slate-100" />

            {/* ── Tags & Notes ── */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Tags & Notes
              </h3>
              <TagsInput
                label="Tags (press Enter to add)"
                values={form.tags}
                onChange={(v) => set("tags", v)}
                placeholder="e.g. urgent, tier-1, engineering, executive"
              />
              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal Notes</Label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Any internal context, referral source notes, recruiter comments…"
                  rows={4}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--saudi-green))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── GDPR Consent ── */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Data Consent
              </h3>
              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition ${
                  form.gdprConsent
                    ? "border-emerald-300 bg-emerald-50/60"
                    : errors.gdprConsent
                    ? "border-rose-300 bg-rose-50/60"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.gdprConsent}
                  onChange={(e) => {
                    set("gdprConsent", e.target.checked);
                    if (e.target.checked) setErrors((er) => ({ ...er, gdprConsent: "" }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
                />
                <span className="text-sm text-slate-700">
                  I confirm that this candidate has provided explicit consent to have their
                  personal data stored and processed as part of our recruitment process, in
                  compliance with Saudi PDPL and applicable data protection regulations.
                  <span className="ms-1 text-xs text-slate-500">
                    (تاريخ الموافقة على تخزين البيانات مطلوب وفقًا لأنظمة حماية البيانات الشخصية)
                  </span>
                </span>
              </label>
              {errors.gdprConsent && (
                <p className="flex items-center gap-1 text-xs text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  {errors.gdprConsent}
                </p>
              )}
            </section>

            {/* ── Submit ── */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/recruitment/candidates")}
                className="h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Candidate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
