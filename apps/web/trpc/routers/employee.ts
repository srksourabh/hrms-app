import { z } from "zod";
import { createTRPCRouter, companyProcedure, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } from "@hrms-app/validators";
import { and, eq, like, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { writeAudit, SALARY_FIELDS, pickChanged } from "../audit";

const SALARY_AUTHORISED_ROLES = ["super_admin", "hr_manager", "payroll_admin"] as const;
const PROFILE_AUTHORISED_ROLES = ["super_admin", "hr_manager", "hr_specialist"] as const;

export const employeeRouter = createTRPCRouter({
  list: companyProcedure
    .input(employeeQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.status) conditions.push(eq(schema.tenant.employees.employmentStatus, input.status));
      if (input?.departmentId) conditions.push(eq(schema.tenant.employees.departmentId, input.departmentId));
      if (input?.search) {
        conditions.push(like(schema.tenant.employees.fullName, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.employees.findMany({
        where,
        with: { department: true },
        orderBy: desc(schema.tenant.employees.createdAt),
        limit: input?.pageSize ?? 20,
        offset: input?.page ? (input.page - 1) * (input.pageSize ?? 20) : 0,
      });
    }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.employees.findFirst({
      where: eq(schema.tenant.employees.id, input),
      with: {
        department: true,
        manager: true,
        documents: true,
        leaveRequests: true,
        payslips: true,
      },
    });
  }),

  /**
   * Self-service: returns the employee row that the current user is linked to.
   * Available to every authenticated role so the /profile page works for
   * employees, managers, HR and super admins.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const employeeId = ctx.user.employeeId;
    if (!employeeId) return null;
    return await ctx.db.query.employees.findFirst({
      where: eq(schema.tenant.employees.id, employeeId),
      with: { department: true, manager: true },
    });
  }),

  // Employees can submit a self-onboarding record (org-wide); HR and
  // super_admin can create records directly. Either way, the record lands
  // in the same table — RBAC + ownership scopes decide what the rest of the
  // app can do with it.
  // Creating employee records is a people-management action (HR / super admin).
  create: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(createEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const [employee] = await ctx.db.insert(schema.tenant.employees).values(input).returning();
      await writeAudit(ctx, {
        action: "employee.create",
        entityType: "employee",
        entityId: employee?.id ?? "unknown",
        newValue: { fullName: input.fullName, nationality: input.nationality, departmentId: input.departmentId },
      });
      return employee;
    }),

  // Field-scoped update (B1):
  //  - Salary fields (salaryBasic/Housing/Transport) may be changed only by
  //    super_admin / hr_manager / payroll_admin. An hr_specialist salary change
  //    is NOT applied — it must be actioned by HR Manager (WF-003 / RBAC-003).
  //  - Profile/job fields may be edited only by super_admin / hr_manager /
  //    hr_specialist (payroll_admin can touch salary but not job data — RBAC-004).
  //  - Every applied change is audited with old/new values (RBAC-006).
  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateEmployeeSchema }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user.role;
      const data = input.data as Record<string, unknown>;
      const touchesSalary = SALARY_FIELDS.some((f) => data[f] !== undefined);
      const touchesProfile = Object.keys(data).some(
        (k) => !SALARY_FIELDS.includes(k as (typeof SALARY_FIELDS)[number]),
      );

      if (touchesSalary) {
        if (role === "hr_specialist") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "A salary change by an HR Specialist must be approved by an HR Manager and cannot be applied directly.",
          });
        }
        if (!SALARY_AUTHORISED_ROLES.includes(role as (typeof SALARY_AUTHORISED_ROLES)[number])) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not permitted to change salary." });
        }
      }
      if (touchesProfile && !PROFILE_AUTHORISED_ROLES.includes(role as (typeof PROFILE_AUTHORISED_ROLES)[number])) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not permitted to edit employee profile fields." });
      }

      const current = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input.id),
      });
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });

      const [employee] = await ctx.db
        .update(schema.tenant.employees)
        .set(input.data)
        .where(eq(schema.tenant.employees.id, input.id))
        .returning();

      await writeAudit(ctx, {
        action: touchesSalary ? "employee.salary_change" : "employee.update",
        entityType: "employee",
        entityId: input.id,
        oldValue: pickChanged(current as Record<string, unknown>, data),
        newValue: data,
      });
      return employee;
    }),

  delete: requireRole("super_admin")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input),
      });
      await ctx.db.delete(schema.tenant.employees).where(eq(schema.tenant.employees.id, input));
      await writeAudit(ctx, {
        action: "employee.delete",
        entityType: "employee",
        entityId: input,
        oldValue: current ? { fullName: (current as Record<string, unknown>).fullName } : null,
      });
      return { success: true };
    }),

  count: companyProcedure
    .input(employeeQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.status) conditions.push(eq(schema.tenant.employees.employmentStatus, input.status));
      if (input?.departmentId) conditions.push(eq(schema.tenant.employees.departmentId, input.departmentId));
      if (input?.search) {
        conditions.push(like(schema.tenant.employees.fullName, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [result] = await ctx.db
        .select({ value: count() })
        .from(schema.tenant.employees)
        .where(where);
      return result?.value ?? 0;
    }),
});
