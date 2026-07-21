import { z } from "zod";
import { createTRPCRouter, companyProcedure, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } from "@hrms-app/validators";
import { and, eq, like, desc, asc, count, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { writeAudit, SALARY_FIELDS, pickChanged } from "../audit";
import { getManagedDepartmentIds } from "../scoping";
import { can } from "@hrms-app/auth/rbac";

/** Null out salary fields on an employee row for callers lacking payroll:view_company (RBAC-003). */
function redactSalary<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const k of SALARY_FIELDS) if (k in out) out[k] = null;
  return out as T;
}

const SALARY_AUTHORISED_ROLES = ["super_admin", "hr_manager", "payroll_admin"] as const;
const PROFILE_AUTHORISED_ROLES = ["super_admin", "hr_manager", "hr_specialist"] as const;

export const employeeRouter = createTRPCRouter({
  list: companyProcedure
    .input(employeeQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: (ReturnType<typeof eq> | undefined)[] = [];
      if (input?.status) conditions.push(eq(schema.tenant.employees.employmentStatus, input.status));
      if (input?.departmentId) conditions.push(eq(schema.tenant.employees.departmentId, input.departmentId));
      if (input?.search) {
        conditions.push(like(schema.tenant.employees.fullName, `%${input.search}%`));
      }
      // Department Manager sees only their own department(s) (RBAC-002).
      if (ctx.user.role === "department_manager") {
        const managed = await getManagedDepartmentIds(ctx);
        if (managed.length === 0) return [];
        conditions.push(inArray(schema.tenant.employees.departmentId, managed));
      }
      const active = conditions.filter(Boolean) as ReturnType<typeof eq>[];
      const where = active.length > 0 ? and(...active) : undefined;

      // Sortable columns (LIST-003), whitelisted to avoid arbitrary-column sort.
      const sortColumn =
        input?.sortBy === "fullName" ? schema.tenant.employees.fullName
        : input?.sortBy === "hireDate" ? schema.tenant.employees.hireDate
        : schema.tenant.employees.createdAt;
      const orderBy = (input?.sortDir ?? "desc") === "asc" ? asc(sortColumn) : desc(sortColumn);

      const rows = await ctx.db.query.employees.findMany({
        where,
        with: { department: true },
        orderBy,
        limit: input?.pageSize ?? 20,
        offset: input?.page ? (input.page - 1) * (input.pageSize ?? 20) : 0,
      });
      // RBAC-003/API-004: roles without payroll:view_company must not see salary.
      if (!can(ctx.user.role, "payroll:view_company")) {
        return rows.map(redactSalary);
      }
      return rows;
    }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const employee = await ctx.db.query.employees.findFirst({
      where: eq(schema.tenant.employees.id, input),
      with: {
        department: true,
        manager: true,
        documents: true,
        leaveRequests: true,
        payslips: true,
      },
    });
    if (!employee) return null;

    // RBAC-003: a Department Manager may only open employees in the department(s)
    // they manage; getById was previously fetchable for any id in the tenant.
    if (ctx.user.role === "department_manager") {
      const managed = await getManagedDepartmentIds(ctx);
      if (!employee.departmentId || !managed.includes(employee.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This employee is outside your department." });
      }
    }

    // RBAC-003/API-004: strip salary + payslips for roles lacking payroll:view_company.
    if (!can(ctx.user.role, "payroll:view_company")) {
      return { ...redactSalary(employee), payslips: [] };
    }
    return employee;
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

  /**
   * PDPL data-subject access request (PDPL-001): an employee exports their own
   * complete record. Own data only; the export itself is audited.
   */
  exportMyData: protectedProcedure.query(async ({ ctx }) => {
    const employeeId = ctx.user.employeeId;
    if (!employeeId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No employee profile is linked to this account." });
    }
    const subject = await ctx.db.query.employees.findFirst({
      where: eq(schema.tenant.employees.id, employeeId),
      with: { department: true, documents: true, leaveRequests: true, payslips: true },
    });
    if (!subject) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });

    await writeAudit(ctx, {
      action: "pdpl.self_export",
      entityType: "employee",
      entityId: employeeId,
    });

    return { exportedAt: new Date().toISOString(), subject };
  }),

  // Employees can submit a self-onboarding record (org-wide); HR and
  // super_admin can create records directly. Either way, the record lands
  // in the same table — RBAC + ownership scopes decide what the rest of the
  // app can do with it.
  // Creating employee records is a people-management action (HR / super admin).
  create: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(createEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      // Reject a duplicate national ID / iqama (EMP-006).
      if (input.iqamaNumberEnc) {
        const dup = await ctx.db.query.employees.findFirst({
          where: eq(schema.tenant.employees.iqamaNumberEnc, input.iqamaNumberEnc),
        });
        if (dup) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An employee with this national ID / iqama already exists.",
          });
        }
      }
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

  // Soft-delete only (EMP-004/EMP-005): the record and all payroll/leave
  // history are preserved. The employee is marked terminated (excluded from
  // active payroll) rather than hard-deleted, so financial/audit history is
  // never lost. Hard deletion is intentionally not exposed.
  delete: requireRole("super_admin")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input),
      });
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });
      const today = new Date().toISOString().slice(0, 10);
      await ctx.db
        .update(schema.tenant.employees)
        .set({ employmentStatus: "terminated", terminationDate: today })
        .where(eq(schema.tenant.employees.id, input));
      await writeAudit(ctx, {
        action: "employee.soft_delete",
        entityType: "employee",
        entityId: input,
        oldValue: {
          fullName: (current as Record<string, unknown>).fullName,
          employmentStatus: (current as Record<string, unknown>).employmentStatus,
        },
      });
      return { success: true, softDeleted: true };
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
