"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Briefcase, ArrowLeft, MapPin, DollarSign, Users, Clock } from "lucide-react";
const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  open: "default",
  closed: "secondary",
  on_hold: "outline",
};
const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  paused: "Paused",
  closed: "Closed",
  filled: "Filled",
  cancelled: "Cancelled",
};
export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: job, isLoading } = api.recruitment.jobRequisition.getById.useQuery(id);
  const deleteMutation = api.recruitment.jobRequisition.delete.useMutation();
  const postMutation = api.recruitment.jobRequisition.post.useMutation();
  const closeMutation = api.recruitment.jobRequisition.close.useMutation();
  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!job) return <div className="flex items-center justify-center h-64">Job not found</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.department?.name ?? "No department"}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          {job.status === "draft" && (
            <Button onClick={() => postMutation.mutate(job.id)}>
              Post Job
            </Button>
          )}
          {job.status === "open" && (
            <Button variant="outline" onClick={() => closeMutation.mutate(job.id)}>
              Close
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/recruitment/jobs/${job.id}/edit`)}>
            Edit
          </Button>
          {job.status === "draft" && (
            <Button variant="destructive" onClick={() => deleteMutation.mutate(job.id)}>
              Delete
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
            </div>
            {job.requirements && (
              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <p className="whitespace-pre-wrap text-muted-foreground">{job.requirements}</p>
              </div>
            )}
            {job.responsibilities && (
              <div>
                <h4 className="font-medium mb-2">Responsibilities</h4>
                <p className="whitespace-pre-wrap text-muted-foreground">{job.responsibilities}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{job.type.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.isRemote ? "Remote" : (job.location ?? "On-site")}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                {job.minSalary && job.maxSalary
                  ? `${job.minSalary} - ${job.maxSalary} ${job.currency}`
                  : job.minSalary
                  ? `From ${job.minSalary} ${job.currency}`
                  : "Not specified"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{job.filledCount} / {job.openings} filled</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Not posted"}</span>
            </div>
            {job.closedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Closed: {new Date(job.closedAt).toLocaleDateString()}</span>
              </div>
            )}
            {job.hiringManager && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Hiring Manager: {job.hiringManager.fullName}</span>
              </div>
            )}
            {job.recruiter && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Recruiter: {job.recruiter.fullName}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Applications ({job.applications?.length ?? 0})</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/recruitment/applications?jobRequisitionId=${job.id}`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.applications?.slice(0, 5).map((app: any) => (
                <TableRow key={app.id} className="cursor-pointer" onClick={() => router.push(`/recruitment/applications/${app.id}`)}>
                  <TableCell>{app.candidate?.firstName} {app.candidate?.lastName}</TableCell>
                  <TableCell>
                    <Badge variant={app.status === "hired" ? "default" : app.status === "rejected" ? "destructive" : "outline"}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{app.currentStage}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/recruitment/applications/${app.id}`); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(job.applications?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No applications yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}