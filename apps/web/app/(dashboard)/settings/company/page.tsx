"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Mail,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface CompanyProfile {
  industry: string;
  companySize: string;
  website: string;
}

interface Department {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
}

export default function CompanySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "departments" | "team">("profile");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<CompanyProfile>({
    industry: "",
    companySize: "",
    website: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptName, setDeptName] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);

  // Team / invites state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("hr_manager");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Master onboarding complete
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [completingSetup, setCompletingSetup] = useState(false);

  // Load initial data
  async function loadData() {
    const res = await fetch("/api/company/profile");
    if (res.ok) {
      const data = await res.json();
      if (data.industry || data.companySize || data.website) {
        setProfile({ industry: data.industry ?? "", companySize: data.companySize ?? "", website: data.website ?? "" });
      }
    }

    // Check if onboarding already completed
    const statusRes = await fetch("/api/company/setup-status");
    if (statusRes.ok) {
      const status = await statusRes.json();
      setOnboardingComplete(status.completed);
    }

    // Load departments
    const deptRes = await fetch("/api/company/departments");
    if (deptRes.ok) {
      const deptData = await deptRes.json();
      setDepartments(deptData.departments ?? []);
    }

    // Load pending invites
    const inviteRes = await fetch("/api/company/invites");
    if (inviteRes.ok) {
      const inviteData = await inviteRes.json();
      setInvites(inviteData.invites ?? []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveProfile() {
    setProfileLoading(true);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save");
      setProfileSaved(true);
      setMessage({ text: "Company profile saved", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: "Failed to save profile", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function addDepartment() {
    if (!deptName.trim()) return;
    setDeptLoading(true);
    try {
      const res = await fetch("/api/company/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add department");
      const data = await res.json();
      setDepartments((d) => [...d, data.department]);
      setDeptName("");
    } catch {
      setMessage({ text: "Failed to add department", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeptLoading(false);
    }
  }

  async function removeDepartment(id: string) {
    const res = await fetch(`/api/company/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDepartments((d) => d.filter((dept) => dept.id !== id));
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to send invite");
      }
      const data = await res.json();
      setInvites((d) => [...d, data.invite]);
      setInviteEmail("");
      setMessage({ text: "Invitation sent successfully", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message ?? "Failed to send invite", type: "error" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setInviteLoading(false);
    }
  }

  async function completeOnboarding() {
    setCompletingSetup(true);
    try {
      const res = await fetch("/api/company/setup-complete", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setOnboardingComplete(true);
      setMessage({ text: "Setup complete! Welcome to your workspace.", type: "success" });
      router.push("/");
      router.refresh();
    } catch {
      setMessage({ text: "Something went wrong", type: "error" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setCompletingSetup(false);
    }
  }

  const TABS = [
    { id: "profile" as const, label: "Company Profile", icon: Building2 },
    { id: "departments" as const, label: "Departments", icon: Users },
    { id: "team" as const, label: "Team & Invites", icon: Mail },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Company Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your company profile, departments, and team.</p>
      </div>

      {/* Onboarding banner — only if not complete */}
      {!onboardingComplete && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-800" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Complete your company setup</h3>
            <p className="mt-1 text-sm text-amber-700">
              Fill in your company details, add departments, and invite your HR team. Once done, your full workspace will be unlocked.
            </p>
          </div>
          <button
            onClick={completeOnboarding}
            disabled={completingSetup}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {completingSetup ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Finish setup
          </button>
        </div>
      )}

      {/* Inline message */}
      {message && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Profile tab ─── */}
      {activeTab === "profile" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Company Profile</h2>
          <p className="mt-0.5 text-xs text-slate-500">This information is used for compliance reports and regulatory filings.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Industry</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
                value={profile.industry}
                onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
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
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Company size</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
                value={profile.companySize}
                onChange={(e) => setProfile((p) => ({ ...p, companySize: e.target.value }))}
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
                value={profile.website}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
            >
              {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </button>
            {profileSaved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Departments tab ─── */}
      {activeTab === "departments" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Departments</h2>
          <p className="mt-0.5 text-xs text-slate-500">Departments organize your reporting lines and payroll groups.</p>

          <div className="mt-6 space-y-2">
            {departments.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No departments yet. Add your first one below.</p>
            )}
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-sm font-medium text-slate-700">{dept.name}</span>
                <button
                  onClick={() => removeDepartment(dept.id)}
                  className="text-slate-400 transition hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Department name…"
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()}
            />
            <button
              onClick={addDepartment}
              disabled={deptLoading || !deptName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      )}

      {/* ─── Team / Invites tab ─── */}
      {activeTab === "team" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Invite team members</h2>
          <p className="mt-0.5 text-xs text-slate-500">Invitations expire after 7 days. The inviting user becomes the Super Admin of this workspace.</p>

          {/* Pending invites */}
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pending invitations</h3>
            {invites.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">No pending invitations.</p>
            )}
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 mb-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-sm text-slate-700">{inv.email}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  {inv.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          {/* Send invite */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Send new invitation</h3>
            <div className="flex items-start gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              />
              <select
                className="w-44 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:border-emerald-600 focus:ring-emerald-600 focus:outline-none"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="hr_manager">HR Manager</option>
                <option value="payroll_admin">Payroll Admin</option>
                <option value="department_manager">Dept. Manager</option>
                <option value="employee">Employee</option>
              </select>
              <button
                onClick={sendInvite}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
