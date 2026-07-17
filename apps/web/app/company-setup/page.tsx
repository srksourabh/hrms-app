"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Company Profile", icon: Building2 },
  { id: 2, title: "Departments", icon: Users },
  { id: 3, title: "Invite Team", icon: CheckCircle2 },
];

interface Department {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
}

type StepData = {
  companyProfile: {
    industry: string;
    companySize: string;
    website: string;
  };
  departments: Department[];
  invites: Invite[];
};

export default function CompanySetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<StepData>({
    companyProfile: { industry: "", companySize: "", website: "" },
    departments: [{ id: "1", name: "" }],
    invites: [],
  });

  // New department row being typed
  const [newDeptName, setNewDeptName] = useState("");

  // New invite row being typed
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("hr_manager");

  function addDepartment() {
    if (!newDeptName.trim()) return;
    setData((d) => ({
      ...d,
      departments: [...d.departments, { id: crypto.randomUUID(), name: newDeptName.trim() }],
    }));
    setNewDeptName("");
  }

  function removeDepartment(id: string) {
    setData((d) => ({ ...d, departments: d.departments.filter((dept) => dept.id !== id) }));
  }

  function updateDepartmentName(id: string, name: string) {
    setData((d) => ({
      ...d,
      departments: d.departments.map((dept) => (dept.id === id ? { ...dept, name } : dept)),
    }));
  }

  function addInvite() {
    if (!newInviteEmail.trim()) return;
    setData((d) => ({
      ...d,
      invites: [
        ...d.invites,
        { id: crypto.randomUUID(), email: newInviteEmail.trim(), role: newInviteRole },
      ],
    }));
    setNewInviteEmail("");
  }

  function removeInvite(id: string) {
    setData((d) => ({ ...d, invites: d.invites.filter((inv) => inv.id !== id) }));
  }

  async function completeSetup() {
    setSubmitting(true);
    setError("");
    try {
      // 1. Update tenant profile (industry, size, website)
      const profileRes = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.companyProfile),
      });
      if (!profileRes.ok) throw new Error("Failed to update company profile");

      // 2. Create departments
      for (const dept of data.departments) {
        if (!dept.name.trim()) continue;
        await fetch("/api/company/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: dept.name.trim() }),
        });
      }

      // 3. Send invites
      for (const invite of data.invites) {
        await fetch("/api/company/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email, role: invite.role }),
        });
      }

      // 4. Mark onboarding complete
      const finishRes = await fetch("/api/company/setup-complete", { method: "POST" });
      if (!finishRes.ok) throw new Error("Failed to complete setup");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setSubmitting(false);
    }
  }

  const canProceed1 =
    data.companyProfile.industry.trim() !== "" && data.companyProfile.companySize.trim() !== "";
  const canProceed2 = data.departments.some((d) => d.name.trim() !== "");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white mb-4 shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Set up your company</h1>
          <p className="mt-1 text-sm text-slate-500">
            Just three quick steps to get your workspace ready
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`h-px w-16 sm:w-24 transition-colors ${
                      isDone ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all shadow-sm ${
                      isDone
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : isActive
                        ? "border-emerald-700 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isActive ? "text-emerald-700" : isDone ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Tell us about your company</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  This helps us tailor the experience for Saudi HR compliance.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                    value={data.companyProfile.industry}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        companyProfile: { ...d.companyProfile, industry: e.target.value },
                      }))
                    }
                  >
                    <option value="">Select industry…</option>
                    <option value="oil_and_gas">Oil &amp; Gas / Energy</option>
                    <option value="construction">Construction &amp; Engineering</option>
                    <option value="retail">Retail &amp; Consumer</option>
                    <option value="healthcare">Healthcare &amp; Pharmaceuticals</option>
                    <option value="finance">Finance &amp; Banking</option>
                    <option value="it">Information Technology</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="logistics">Logistics &amp; Transport</option>
                    <option value="hospitality">Hospitality &amp; Tourism</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">
                    Company size <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                    value={data.companyProfile.companySize}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        companyProfile: { ...d.companyProfile, companySize: e.target.value },
                      }))
                    }
                  >
                    <option value="">Select headcount…</option>
                    <option value="1-10">1 – 10 employees</option>
                    <option value="11-50">11 – 50 employees</option>
                    <option value="51-200">51 – 200 employees</option>
                    <option value="201-500">201 – 500 employees</option>
                    <option value="501-1000">501 – 1,000 employees</option>
                    <option value="1000+">Over 1,000 employees</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">Website</label>
                  <input
                    type="url"
                    placeholder="https://yourcompany.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                    value={data.companyProfile.website}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        companyProfile: { ...d.companyProfile, website: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Departments */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Create your departments</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Departments help you organize reporting lines and manage payroll groups.
                </p>
              </div>

              <div className="space-y-2">
                {data.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Finance, Operations…"
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                      value={dept.name}
                      onChange={(e) => updateDepartmentName(dept.id, e.target.value)}
                    />
                    {data.departments.length > 1 && (
                      <button
                        onClick={() => removeDepartment(dept.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    departments: [...d.departments, { id: crypto.randomUUID(), name: "" }],
                  }))
                }
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Add another department
              </button>
            </div>
          )}

          {/* STEP 3: Invite Team */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Invite your HR team</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  They'll receive an email with a link to join your workspace. You can skip this and
                  invite later from Settings → Team.
                </p>
              </div>

              {/* Invite rows */}
              <div className="space-y-2">
                {data.invites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 flex items-center gap-2">
                      <span className="truncate">{inv.email}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wide">
                        {inv.role.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => removeInvite(inv.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add invite row */}
              <div className="flex items-start gap-2">
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                />
                <select
                  className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none transition"
                  value={newInviteRole}
                  onChange={(e) => setNewInviteRole(e.target.value)}
                >
                  <option value="hr_manager">HR Manager</option>
                  <option value="payroll_admin">Payroll Admin</option>
                  <option value="department_manager">Dept. Manager</option>
                  <option value="employee">Employee</option>
                </select>
                <button
                  onClick={addInvite}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">Note:</strong> Invitations expire after 7 days.
                  The inviting user automatically becomes the Super Admin of this workspace.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : router.push("/login"))}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 1 ? "Back to login" : "Back"}
            </button>

            <div className="flex items-center gap-3">
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !canProceed1) ||
                    (step === 2 && !canProceed2) ||
                    submitting
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={completeSetup}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Completing…
                    </>
                  ) : (
                    <>Complete setup <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
