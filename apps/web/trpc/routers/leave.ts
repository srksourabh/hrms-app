import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole, requireCapability } from "../server";
import { schema } from "@hrms-app/db";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  leaveBalanceSchema,
} from "@hrms-app/validators";
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { runMonthlyAccrual, runAnnualAccrual } from "@hrms-app/leave";
import { getManagedDepartmentIds } from "../scoping";

function parseNumeric(value: string | null | undefined): number {
  return value ? Number.parseFloat(value) : 0;
}

/** Inclusive calendar-day span between two YYYY-MM-DD dates. */
function leaveDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.floor((e - s) / 86_400_000) + 1;
}

/** Adjust a leave balance row by `delta` days (no-op if the row is untracked). */
async function adjustLeaveBalance(
  ctx: { db: any },
  employeeId: string,
  leaveTypeId: string,
  year: number,
  delta: number,
): Promise<void> {
  const bal = await ctx.db.query.leaveBalances.findFirst({
    where: and(
      eq(schema.tenant.leaveBalances.employeeId, employeeId),
      eq(schema.tenant.leaveBalances.leaveTypeId, leaveTypeId),
      eq(schema.tenant.leaveBalances.year, year),
    ),
  });
  if (!bal) return;
  const next = Math.max(0, parseNumeric(bal.balance) + delta);
  await ctx.db
    .update(schema.tenant.leaveBalances)
    .set({ balance: next.toString() })
    .where(eq(schema.tenant.leaveBalances.id, bal.id));
}

function toLeaveTypeContext(row: typeof schema.tenant.leaveTypes.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    daysAllowed: row.daysAllowed,
    rules: row.rules,
  };
}

function toEmployeeContext(row: typeof schema.tenant.employees.$inferSelect) {
  return {
    id: row.id,
    fullName: row.fullName,
    hireDate: row.hireDate,
    employmentStatus: row.employmentStatus,
  };
}

function toLeaveBalanceContext(row: typeof schema.tenant.leaveBalances.$inferSelect) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    balance: parseNumeric(row.balance),
    year: row.year,
  };
}

export const leaveRouter = createTRPCRouter({
  leaveType: createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.query.leaveTypes.findMany({
        orderBy: (leaveTypes: any, { asc }: any) => asc(leaveTypes.name),
      });
    }),

    create: requireRole("super_admin", "hr_manager")
      .input(createLeaveTypeSchema)
      .mutation(async ({ ctx, input }) => {
        const [leaveType] = await ctx.db.insert(schema.tenant.leaveTypes).values(input).returning();
        return leaveType;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateLeaveTypeSchema }))
      .mutation(async ({ ctx, input }) => {
        const [leaveType] = await ctx.db
          .update(schema.tenant.leaveTypes)
          .set(input.data)
          .where(eq(schema.tenant.leaveTypes.id, input.id))
          .returning();
        return leaveType;
      }),

    delete: requireRole("super_admin")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.leaveBalances.findFirst({
          where: eq(schema.tenant.leaveBalances.leaveTypeId, input),
        });
        if (existing) {
          throw new Error("Cannot delete leave type with existing balances");
        }
        await ctx.db.delete(schema.tenant.leaveTypes).where(eq(schema.tenant.leaveTypes.id, input));
        return { success: true };
      }),
  }),

  request: createTRPCRouter({
    list: requireCapability("leave:view_company")
      .input(
        z
          .object({
            status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
            employeeId: z.string().uuid().optional(),
          })
          .optional()
          .default({})
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.status) conditions.push(eq(schema.tenant.leaveRequests.status, input.status));

        if (ctx.user.role === "employee") {
          const user = await ctx.adminDb.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, ctx.user.id!),
          });
          if (user?.employeeId) {
            conditions.push(eq(schema.tenant.leaveRequests.employeeId, user.employeeId));
          }
        } else if (input?.employeeId) {
          conditions.push(eq(schema.tenant.leaveRequests.employeeId, input.employeeId));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.leaveRequests.findMany({
          where,
          with: { employee: true, leaveType: true, approvedBy: true },
          orderBy: desc(schema.tenant.leaveRequests.createdAt),
          limit: 100,
        });
      }),

    getById: requireCapability("leave:view_company").input(z.string().uuid()).query(async ({ ctx, input }) => {
      return await ctx.db.query.leaveRequests.findFirst({
        where: eq(schema.tenant.leaveRequests.id, input),
        with: { employee: true, leaveType: true, approvedBy: true },
      });
    }),

    create: protectedProcedure
      .input(createLeaveRequestSchema)
      .mutation(async ({ ctx, input }) => {
        // Only HR roles may file leave on behalf of another employee. Every
        // other role (employee, recruiter, payroll_admin, department_manager)
        // is bound to their own session employee — a client-supplied
        // employeeId is never trusted for them (SEC-012).
        const LEAVE_ONBEHALF_ROLES = ["super_admin", "hr_manager", "hr_specialist"];
        let employeeId: string;
        if (LEAVE_ONBEHALF_ROLES.includes(ctx.user.role) && input.employeeId) {
          employeeId = input.employeeId;
        } else {
          const linkedEmployeeId = ctx.user.employeeId || (
            await ctx.adminDb.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, ctx.user.id!),
            })
          )?.employeeId;
          if (!linkedEmployeeId) {
            throw new Error("Employee profile is not linked to this login");
          }
          employeeId = linkedEmployeeId;
        }

        // Overlap check (LEV-010): reject a request that overlaps an existing
        // active (pending/approved) request for the same employee.
        const active = await ctx.db.query.leaveRequests.findMany({
          where: eq(schema.tenant.leaveRequests.employeeId, employeeId),
        });
        const overlaps = active.some(
          (r: { status: string; startDate: string; endDate: string }) =>
            (r.status === "pending" || r.status === "approved") &&
            r.startDate <= input.endDate &&
            r.endDate >= input.startDate,
        );
        if (overlaps) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This leave overlaps an existing pending or approved request.",
          });
        }

        // Balance check (LEV-009): block a request that exceeds the available
        // balance for the leave type/year (when a balance is tracked).
        const requestedDays = leaveDays(input.startDate, input.endDate);
        const year = new Date(input.startDate).getUTCFullYear();
        const bal = await ctx.db.query.leaveBalances.findFirst({
          where: and(
            eq(schema.tenant.leaveBalances.employeeId, employeeId),
            eq(schema.tenant.leaveBalances.leaveTypeId, input.leaveTypeId),
            eq(schema.tenant.leaveBalances.year, year),
          ),
        });
        if (bal && requestedDays > parseNumeric(bal.balance)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `This request is ${requestedDays} days but only ${parseNumeric(bal.balance)} are available.`,
          });
        }

        const [request] = await ctx.db
          .insert(schema.tenant.leaveRequests)
          .values({ ...input, employeeId })
          .returning();
        return request;
      }),

    updateStatus: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: z.string().uuid(), data: updateLeaveRequestSchema }))
      .mutation(async ({ ctx, input }) => {
        // Department Manager may only action leave for their own department (RBAC-002).
        if (ctx.user.role === "department_manager") {
          const existing = await ctx.db.query.leaveRequests.findFirst({
            where: eq(schema.tenant.leaveRequests.id, input.id),
            with: { employee: true },
          });
          if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found." });
          const deptId = (existing.employee as { departmentId?: string } | null)?.departmentId;
          const managed = await getManagedDepartmentIds(ctx);
          if (!deptId || !managed.includes(deptId)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only approve leave requests for employees in your own department.",
            });
          }
        }

        // Load the current request to compute the balance effect of the
        // status transition (WF-001).
        const current = await ctx.db.query.leaveRequests.findFirst({
          where: eq(schema.tenant.leaveRequests.id, input.id),
        });
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found." });

        const days = leaveDays(current.startDate, current.endDate);
        const year = new Date(current.startDate).getUTCFullYear();
        const wasApproved = current.status === "approved";
        const nowApproved = input.data.status === "approved";

        // Guards run BEFORE the write so a rejected transition leaves no
        // half-applied state (these mutations are not transactional).
        if (!wasApproved && nowApproved) {
          // BIZ-005: no one may approve their own leave (segregation of duties).
          if (ctx.user.employeeId && current.employeeId === ctx.user.employeeId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You cannot approve your own leave request." });
          }
          // BIZ-004: re-validate the balance at the approval boundary — it may
          // have been drawn down by other approvals since submission.
          const bal = await ctx.db.query.leaveBalances.findFirst({
            where: and(
              eq(schema.tenant.leaveBalances.employeeId, current.employeeId),
              eq(schema.tenant.leaveBalances.leaveTypeId, current.leaveTypeId),
              eq(schema.tenant.leaveBalances.year, year),
            ),
          });
          if (bal && days > parseNumeric(bal.balance)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient leave balance: ${days} days requested, ${parseNumeric(bal.balance)} available.`,
            });
          }
        }

        const [request] = await ctx.db
          .update(schema.tenant.leaveRequests)
          .set(input.data)
          .where(eq(schema.tenant.leaveRequests.id, input.id))
          .returning();

        // Balance moves only on the approval boundary: decrement when a request
        // becomes approved, restore when a previously-approved one is
        // rejected/cancelled. Pending↔rejected never touches the balance.
        if (!wasApproved && nowApproved) {
          await adjustLeaveBalance(ctx, current.employeeId, current.leaveTypeId, year, -days);
        } else if (wasApproved && !nowApproved) {
          await adjustLeaveBalance(ctx, current.employeeId, current.leaveTypeId, year, +days);
        }

        return request;
      }),

    my: protectedProcedure.query(async ({ ctx }) => {
      const user = await ctx.adminDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id!),
      });
      if (!user?.employeeId) return [];
      return await ctx.db.query.leaveRequests.findMany({
        where: eq(schema.tenant.leaveRequests.employeeId, user.employeeId),
        with: { leaveType: true, approvedBy: true },
        orderBy: desc(schema.tenant.leaveRequests.createdAt),
        limit: 100,
      });
    }),
  }),

  balance: createTRPCRouter({
    list: requireCapability("leave:view_company")
      .input(
        z
          .object({
            employeeId: z.string().uuid().optional(),
            year: z.coerce.number().int().optional(),
          })
          .optional()
          .default({})
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.leaveBalances.employeeId, input.employeeId));
        if (input?.year) conditions.push(eq(schema.tenant.leaveBalances.year, input.year));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.leaveBalances.findMany({
          where,
          with: { employee: true, leaveType: true },
          limit: 200,
        });
      }),

    create: requireRole("super_admin", "hr_manager")
      .input(leaveBalanceSchema)
      .mutation(async ({ ctx, input }) => {
        const [balance] = await ctx.db.insert(schema.tenant.leaveBalances).values(input).returning();
        return balance;
      }),

    runAccrual: requireRole("super_admin", "hr_manager")
      .input(
        z
          .object({
            frequency: z.enum(["monthly", "annual"]).default("monthly"),
            effectiveDate: z.string().optional(),
            year: z.coerce.number().int().optional(),
          })
          .optional()
          .default({ frequency: "monthly" })
      )
      .mutation(async ({ ctx, input }) => {
        const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
        const targetYear = input.year ?? effectiveDate.getFullYear();

        const [leaveTypes, employees, existingBalances] = await Promise.all([
          ctx.db.query.leaveTypes.findMany(),
          ctx.db.query.employees.findMany({
            where: eq(schema.tenant.employees.employmentStatus, "active"),
          }),
          ctx.db.query.leaveBalances.findMany({
            where: eq(schema.tenant.leaveBalances.year, targetYear),
          }),
        ]);

        const config = {
          effectiveDate,
          runForYear: targetYear,
        };

        const results = input.frequency === "annual"
          ? runAnnualAccrual(
              leaveTypes.map(toLeaveTypeContext),
              employees.map(toEmployeeContext),
              existingBalances.map(toLeaveBalanceContext),
              config
            )
          : runMonthlyAccrual(
              leaveTypes.map(toLeaveTypeContext),
              employees.map(toEmployeeContext),
              existingBalances.map(toLeaveBalanceContext),
              config
            );

        for (const result of results) {
          if (result.daysAccrued === 0) continue;

          if (result.created) {
            await ctx.db.insert(schema.tenant.leaveBalances).values({
              employeeId: result.employeeId,
              leaveTypeId: result.leaveTypeId,
              balance: result.newBalance.toString(),
              year: result.year,
            });
          } else {
            await ctx.db
              .update(schema.tenant.leaveBalances)
              .set({ balance: result.newBalance.toString() })
              .where(
                and(
                  eq(schema.tenant.leaveBalances.employeeId, result.employeeId),
                  eq(schema.tenant.leaveBalances.leaveTypeId, result.leaveTypeId),
                  eq(schema.tenant.leaveBalances.year, result.year)
                )
              );
          }
        }

        return {
          processed: results.length,
          accrued: results.filter((r: any) => r.daysAccrued > 0).length,
          results,
        };
      }),
  }),
});
