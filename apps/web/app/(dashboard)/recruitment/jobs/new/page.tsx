"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Label } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Briefcase, Users, MapPin, DollarSign, ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobRequisitionSchema, jobTypeEnum } from "@hrms-app/validators";
import type { z } from "zod";
const statusColors = {
  draft: "outline",
  open: "default",
  paused: "secondary",
  closed: "destructive",
  filled: "default",
  cancelled: "destructive",
} as const;
export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createJobRequisitionSchema),
    defaultValues: {
      type: "full_time",
      isRemote: false,
      currency: "SAR",
      openings: 1,
    },
  });
  const departments = api.department.list.useQuery();
  const employees = api.employee.list.useQuery({});
  const createMutation = api.recruitment.jobRequisition.create.useMutation();
  const onSubmit = async (data: z.infer<typeof createJobRequisitionSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await createMutation.mutateAsync(data);
      if (result) router.push(`/recruitment/jobs/${result.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create job requisition");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Job Requisition</h1>
          <p className="text-muted-foreground">Create a new job opening</p>
        </div>
        <div className="ml-auto">
          <Button type="submit" disabled={isSubmitting || departments.isLoading}>
            <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} placeholder="e.g., Senior Software Engineer" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select {...register("departmentId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.data?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Job Type *</Label>
            <Select {...register("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypeEnum.options.map((t: any) => (
                  <SelectItem key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (l: any) => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiringManagerId">Hiring Manager</Label>
            <Select {...register("hiringManagerId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select hiring manager" />
              </SelectTrigger>
              <SelectContent>
                {employees.data?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName} - {e.department?.name ?? "No Dept"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiterId">Recruiter</Label>
            <Select {...register("recruiterId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                {employees.data?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName} - {e.department?.name ?? "No Dept"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" {...register("description")} rows={4} placeholder="Describe the role, team, and impact..." />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" {...register("requirements")} rows={4} placeholder="Required skills, experience, qualifications..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea id="responsibilities" {...register("responsibilities")} rows={4} placeholder="Key responsibilities and duties..." />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} placeholder="e.g., Riyadh, Saudi Arabia" />
            </div>
            <div className="space-y-2">
              <Label>Remote</Label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isRemote" {...register("isRemote")} className="h-4 w-4" />
                <Label htmlFor="isRemote" className="mb-0">Allow remote work</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openings">Openings *</Label>
              <Input id="openings" type="number" min="1" {...register("openings", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="minSalary">Min Salary (SAR)</Label>
              <Input id="minSalary" type="number" min="0" step="100" {...register("minSalary", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSalary">Max Salary (SAR)</Label>
              <Input id="maxSalary" type="number" min="0" step="100" {...register("maxSalary", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}