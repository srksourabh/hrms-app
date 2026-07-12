"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { Button, Badge, DualDate } from "@hrms-app/ui";
import { Upload, Search, Trash2 } from "lucide-react";
import Link from "next/link";

const docTypes = ["iqama", "passport", "work_permit", "contract", "certificate", "other"] as const;

function getExpiryStatus(expiryDate: string | null | undefined): { label: string; className: string } {
  if (!expiryDate) return { label: "Valid", className: "bg-green-100 text-green-800 border-green-200" };
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", className: "bg-red-100 text-red-800 border-red-200" };
  if (diffDays <= 30) return { label: "Expiring soon", className: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Valid", className: "bg-green-100 text-green-800 border-green-200" };
}

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const utils = api.useUtils();

  const { data: documents, isLoading } = api.document.list.useQuery({
    type: (typeFilter as any) || undefined,
    pageSize: 50,
  });

  const deleteMutation = api.document.delete.useMutation({
    onSuccess: () => utils.document.list.invalidate(),
  });

  const filtered = documents?.filter((doc: any) => {
    if (search) {
      return doc.employee?.fullName?.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage employee documents</p>
        </div>
        <Button asChild>
          <Link href="/documents/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All</option>
            {docTypes.map((t: any) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Employee</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Document Type</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">File Name</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Expiry Date</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((doc: any) => {
              const expiry = getExpiryStatus(doc.expiryDate);
              return (
                <tr key={doc.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 align-middle">{doc.employee?.fullName}</td>
                  <td className="p-4 align-middle capitalize">{doc.type.replace("_", " ")}</td>
                  <td className="p-4 align-middle">{doc.fileName}</td>
                  <td className="p-4 align-middle">
                    {doc.expiryDate ? <DualDate date={doc.expiryDate} locale="ar" /> : "—"}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline" className={expiry.className}>
                      {expiry.label}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this document?")) deleteMutation.mutate(doc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!filtered || filtered.length === 0) && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
