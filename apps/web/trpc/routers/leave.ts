import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  leaveBalanceSchema,
} from "@hrms-app/validators";
import { and, eq, desc } from "drizzle-orm";
import { runMonthlyAccrual, runAnnualAccrual } from "@hrms-app/leave";

function parseNumeric(value: string | null | undefined): number {
  return value ? Number.parseFloat(value) : 0;
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
    list: protectedProcedure
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
        });
      }),

    getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
      return await ctx.db.query.leaveRequests.findFirst({
        where: eq(schema.tenant.leaveRequests.id, input),
        with: { employee: true, leaveType: true, approvedBy: true },
      });
    }),

    create: protectedProcedure
      .input(createLeaveRequestSchema)
      .mutation(async ({ ctx, input }) => {
        const [request] = await ctx.db.insert(schema.tenant.leaveRequests).values(input).returning();
        return request;
      }),

    updateStatus: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: z.string().uuid(), data: updateLeaveRequestSchema }))
      .mutation(async ({ ctx, input }) => {
        const [request] = await ctx.db
          .update(schema.tenant.leaveRequests)
          .set(input.data)
          .where(eq(schema.tenant.leaveRequests.id, input.id))
          .returning();
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
      });
    }),
  }),

  balance: createTRPCRouter({
    list: protectedProcedure
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
