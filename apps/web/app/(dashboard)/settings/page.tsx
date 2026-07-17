"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { t } from "~/lib/i18n";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";
import { api } from "~/trpc/react";

type PolicyCategory = "hr_policy" | "employee_handbook";

interface PolicyRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  fileName: string;
  fileUrl: string;
  fileSize: string | null;
  mimeType: string | null;
  effectiveDate: string;
  expiryDate: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UploadForm {
  name: string;
  description: string;
  version: string;
  effectiveDate: string;
  expiryDate: string;
}

function UploadModal({
  category,
  onClose,
  onSuccess,
}: {
  category: PolicyCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<UploadForm>({
    name: "",
    description: "",
    version: "1.0",
    effectiveDate: new Date().toISOString().split("T")[0] ?? "",
    expiryDate: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = api.policy.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!form.name || !form.effectiveDate) { setError("Name and effective date are required"); return; }

    setUploading(true);
    setError("");

    try {
      // 1. Upload file
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Upload failed");
        setUploading(false);
        return;
      }

      // 2. Create DB record
      await createMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        category,
        version: form.version || "1.0",
        fileName: file.name,
        fileUrl: uploadData.url,
        fileSize: String(file.size),
        mimeType: file.type,
        effectiveDate: form.effectiveDate,
        expiryDate: form.expiryDate || undefined,
      });
    } catch (err: any) {
      setError(err?.message ?? "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Upload {category === "hr_policy" ? "HR Policy" : "Employee Handbook"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Document Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Leave Policy v2.0"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this document..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Version</label>
              <Input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="1.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Effective Date *</label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expiry Date</label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">File *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-600 hover:file:bg-slate-100"
            />
            <p className="text-xs text-slate-400">PDF, Word, PNG, JPG — max 10MB</p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PolicyTable({
  category,
  policies,
}: {
  category: PolicyCategory;
  policies: PolicyRow[];
}) {
  const utils = api.useUtils();
  const deleteMutation = api.policy.delete.useMutation({
    onSuccess: () => utils.policy.list.invalidate(),
  });

  const filtered = policies.filter((p) => p.category === category);
  const label = category === "hr_policy" ? "HR Policies" : "Employee Handbooks";

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
        <p className="text-sm text-slate-500">No {label.toLowerCase()} uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-2 text-left font-medium text-slate-600">Name</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Version</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Effective</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Expiry</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/50">
              <td className="px-3 py-2">
                <div className="font-medium text-slate-900">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">{p.version}</td>
              <td className="px-3 py-2 text-slate-600">{p.effectiveDate}</td>
              <td className="px-3 py-2 text-slate-600">{p.expiryDate ?? "—"}</td>
              <td className="px-3 py-2 text-right">
                {p.fileUrl && (
                  <a
                    href={p.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-2 text-indigo-600 hover:text-indigo-800"
                  >
                    View
                  </a>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PolicySection({ category }: { category: PolicyCategory }) {
  const [showModal, setShowModal] = useState(false);
  const { data: policies, isLoading } = api.policy.list.useQuery();
  const label = category === "hr_policy" ? "HR Policies" : "Employee Handbooks";
  const description =
    category === "hr_policy"
      ? "Upload and manage company HR policies"
      : "Upload and manage employee handbooks";

  return (
    <Card className="rounded-xl border bg-white p-6 shadow-sm">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Upload</Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500">Loading...</div>
        ) : (
          <PolicyTable category={category} policies={(policies ?? []) as PolicyRow[]} />
        )}
      </CardContent>

      {showModal && (
        <UploadModal
          category={category}
          onClose={() => setShowModal(false)}
          onSuccess={() => {}}
        />
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { regulatoryContext, preferredLanguage: lang } = useRegulatoryContext();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const borderStyle = regulatoryContext === "saudi" ? "border-amber-200/60" : "border-slate-200";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("nav.settings", lang)}</h1>
        <p className="mt-1 text-base text-slate-500">Manage your account settings and preferences</p>
      </div>

      {/* Existing Profile Card */}
      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input value={user?.email ?? ""} disabled placeholder="Email address" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Input value={user?.role ?? ""} disabled placeholder="Role" />
          </div>
        </CardContent>
        <CardFooter className="px-0 pb-0">
          <Button onClick={() => alert("Saved")}>{t("common.save", lang)}</Button>
        </CardFooter>
      </Card>

      {/* Existing Language/Account Card */}
      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Account</CardTitle>
          <CardDescription>Language and regional preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Preferred Language</p>
              <p className="text-xs text-slate-500">Can be changed in the header dropdown</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 uppercase">{lang}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Regulatory Context</p>
              <p className="text-xs text-slate-500">Labour law framework for your company</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 capitalize">{regulatoryContext}</span>
          </div>
        </CardContent>
      </Card>

      {/* Existing Tenant Info Card */}
      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Tenant Info</CardTitle>
          <CardDescription>Your organisation details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Tenant Reference</p>
            <code className="text-sm font-mono text-slate-600">
              {user?.tenantId ? `${user.tenantId.slice(0, 8)}••••${user.tenantId.slice(-4)}` : "—"}
            </code>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Role</p>
            <span className="text-sm font-semibold text-slate-700 capitalize">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Regulatory Context</p>
            <span className="text-sm font-semibold text-slate-700 capitalize">{regulatoryContext}</span>
          </div>
        </CardContent>
      </Card>

      {/* NEW: HR Policies Section */}
      <PolicySection category="hr_policy" />

      {/* NEW: Employee Handbook Section */}
      <PolicySection category="employee_handbook" />
    </div>
  );
}
