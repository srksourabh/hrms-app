"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const DOCUMENT_TYPES = ["iqama", "passport", "work_permit", "contract", "certificate", "other"] as const;

export default function DocumentsUploadPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: employees } = api.employee.list.useQuery({ pageSize: 200 } as any, { staleTime: 60_000 });

  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<string>("other");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [version, setVersion] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.document.create.useMutation({
    onSuccess: async () => {
      await utils.document.list.invalidate();
      router.push("/documents");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!employeeId) e.employeeId = "Employee is required";
    if (!type) e.type = "Document type is required";
    if (!fileName.trim()) e.fileName = "File name is required";
    if (!fileUrl.trim()) e.fileUrl = "File URL is required";
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate))
      e.expiryDate = "Expiry date must be in YYYY-MM-DD format";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      employeeId,
      type: type as any,
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      expiryDate: expiryDate || undefined,
      version,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Documents
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Upload Document</CardTitle>
              <CardDescription>Store a new employee document with metadata and expiry tracking.</CardDescription>
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
              <Label htmlFor="employee">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={employeeId}
                onValueChange={(v) => { setEmployeeId(v); setErrors((er) => ({ ...er, employeeId: "" })); }}
              >
                <SelectTrigger id="employee" className={`w-full ${errors.employeeId ? "border-rose-400" : ""}`}>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.items?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.jobTitle ? `· ${emp.jobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && <p className="text-xs text-rose-600">{errors.employeeId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">
                  Document Type <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => { setType(v); setErrors((er) => ({ ...er, type: "" })); }}
                >
                  <SelectTrigger id="type" className={`w-full ${errors.type ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fileName">
                File Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => { setFileName(e.target.value); setErrors((er) => ({ ...er, fileName: "" })); }}
                placeholder="e.g. Ahmed-Aljameel-Iqama-2026.pdf"
                className={errors.fileName ? "border-rose-400" : ""}
              />
              {errors.fileName && <p className="text-xs text-rose-600">{errors.fileName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fileUrl">
                File URL <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => { setFileUrl(e.target.value); setErrors((er) => ({ ...er, fileUrl: "" })); }}
                placeholder="https://storage.example.com/documents/..."
                className={errors.fileUrl ? "border-rose-400" : ""}
              />
              {errors.fileUrl && <p className="text-xs text-rose-600">{errors.fileUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => { setExpiryDate(e.target.value); setErrors((er) => ({ ...er, expiryDate: "" })); }}
                className={errors.expiryDate ? "border-rose-400" : ""}
              />
              {errors.expiryDate && <p className="text-xs text-rose-600">{errors.expiryDate}</p>}
              <p className="text-xs text-slate-500">Leave blank if the document does not expire</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/documents")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Upload Document</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
