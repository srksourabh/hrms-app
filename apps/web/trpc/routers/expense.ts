import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, companyProcedure } from "../server";
import { schema } from "@hrms-app/db";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import {
  createExpenseSchema,
  updateExpenseSchema,
  approveExpenseSchema,
  expenseQuerySchema,
} from "@hrms-app/validators";

/**
 * Expense router — covers the full employee expense lifecycle:
 *   - list / get              read-only views (company + self)
 *   - create / update / cancel employee actions
 *   - pending-approvals       manager inbox
 *   - approve / reject         manager actions
 *   - mark-paid                finance close-out
 *
 * Access control:
 *   - Employees can create, edit, and cancel their *own* pending expenses
 *   - Managers can list and act on expenses where they are the approver
 *   - HR / super_admin can mark approved expenses as paid
 */
export const expenseRouter = createTRPCRouter({
  /**
   * List expenses visible to the caller.
   * - Employees: only their own expenses.
   * - Managers:  their own + the expenses waiting on their approval.
   * - HR:         all expenses in the tenant.
   */
  list: protectedProcedure
    .input(expenseQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const role = ctx.session!.user.role;
      const userEmployeeId = ctx.session!.user.employeeId as string | undefined;

      // Manager view: own expenses + ones waiting on them.
      if (input?.pendingFor) {
        return await ctx.db.query.expenses.findMany({
          where: and(
            eq(schema.tenant.expenses.approverEmployeeId, input.pendingFor),
            eq(schema.tenant.expenses.status, "pending"),
          ),
          with: { employee: { with: { department: true } } },
          orderBy: desc(schema.tenant.expenses.createdAt),
          limit: input.pageSize ?? 50,
          offset: input.page ? (input.page - 1) * (input.pageSize ?? 50) : 0,
        });
      }

      // Employee self-service.
      if (role === "employee" && userEmployeeId) {
        const conditions: any[] = [eq(schema.tenant.expenses.employeeId, userEmployeeId)];
        if (input?.status) conditions.push(eq(schema.tenant.expenses.status, input.status));
        if (input?.category) conditions.push(eq(schema.tenant.expenses.category, input.category));
        return await ctx.db.query.expenses.findMany({
          where: and(...conditions),
          with: { employee: { with: { department: true } } },
          orderBy: desc(schema.tenant.expenses.createdAt),
          limit: input?.pageSize ?? 50,
          offset: input?.page ? (input.page - 1) * (input.pageSize ?? 50) : 0,
        });
      }

      // HR / super_admin: tenant-wide list.
      const conditions: any[] = [];
      if (input?.status) conditions.push(eq(schema.tenant.expenses.status, input.status));
      if (input?.category) conditions.push(eq(schema.tenant.expenses.category, input.category));
      if (input?.employeeId) conditions.push(eq(schema.tenant.expenses.employeeId, input.employeeId));
      return await ctx.db.query.expenses.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { employee: { with: { department: true } } },
        orderBy: desc(schema.tenant.expenses.createdAt),
        limit: input?.pageSize ?? 50,
        offset: input?.page ? (input.page - 1) * (input.pageSize ?? 50) : 0,
      });
    }),

  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const role = ctx.session!.user.role;
    const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
    const expense = await ctx.db.query.expenses.findFirst({
      where: eq(schema.tenant.expenses.id, input),
      with: {
        employee: { with: { department: true } },
      },
    });
    if (!expense) return null;

    // Access control: only the owner, the approver, or HR can see details.
    const isOwner = expense.employeeId === userEmployeeId;
    const isApprover = expense.approverEmployeeId === userEmployeeId;
    const isHR = role === "hr_manager" || role === "super_admin";
    if (!isOwner && !isApprover && !isHR) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You cannot view this expense" });
    }
    return expense;
  }),

  /**
   * Submit a new expense.
   * - employeeId is taken from the session (employees can only file for themselves)
   * - approverEmployeeId is captured at submission time so the chain-of-command
   *   change later does not lose the request
   * - status defaults to "pending" so the manager sees it in their inbox
   */
  create: protectedProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
      if (!userEmployeeId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your login is not linked to an employee record" });
      }

      // If no explicit approver, fall back to the employee's manager_employee_id.
      let approverEmployeeId = input.approverEmployeeId;
      if (!approverEmployeeId) {
        const employee = await ctx.db.query.employees.findFirst({
          where: eq(schema.tenant.employees.id, userEmployeeId),
        });
        approverEmployeeId = employee?.managerEmployeeId ?? undefined;
      }

      // Validate approver exists if provided.
      if (approverEmployeeId) {
        const approver = await ctx.db.query.employees.findFirst({
          where: eq(schema.tenant.employees.id, approverEmployeeId),
        });
        if (!approver) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Approver employee not found" });
        }
      }

      const [expense] = await ctx.db
        .insert(schema.tenant.expenses)
        .values({
          employeeId: userEmployeeId,
          approverEmployeeId: approverEmployeeId ?? null,
          category: input.category,
          description: input.description,
          amount: String(input.amount),
          currency: input.currency,
          expenseDate: input.expenseDate,
          receiptUrl: input.receiptUrl ?? null,
          status: "pending",
        })
        .returning();

      return expense;
    }),

  update: protectedProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
      const existing = await ctx.db.query.expenses.findFirst({
        where: eq(schema.tenant.expenses.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      // Only the owner can edit, and only while it's still pending.
      if (existing.employeeId !== userEmployeeId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own expenses" });
      }
      if (existing.status !== "pending" && existing.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending or draft expenses can be edited" });
      }
      const { id, ...patch } = input;
      const [updated] = await ctx.db
        .update(schema.tenant.expenses)
        .set({
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.amount !== undefined ? { amount: String(patch.amount) } : {}),
          ...(patch.category !== undefined ? { category: patch.category } : {}),
          ...(patch.expenseDate !== undefined ? { expenseDate: patch.expenseDate } : {}),
          ...(patch.receiptUrl !== undefined ? { receiptUrl: patch.receiptUrl } : {}),
        })
        .where(eq(schema.tenant.expenses.id, id))
        .returning();
      return updated;
    }),

  cancel: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
      const existing = await ctx.db.query.expenses.findFirst({
        where: eq(schema.tenant.expenses.id, input),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.employeeId !== userEmployeeId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel your own expenses" });
      }
      if (existing.status === "paid" || existing.status === "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Approved or paid expenses cannot be cancelled" });
      }
      const [updated] = await ctx.db
        .update(schema.tenant.expenses)
        .set({ status: "cancelled" })
        .where(eq(schema.tenant.expenses.id, input))
        .returning();
      return updated;
    }),

  /**
   * Manager action: approve or reject an expense.
   * - approverEmployeeId on the row must match the caller's employee record.
   * - HR and super_admin can also act on behalf of the line manager.
   */
  approve: protectedProcedure
    .input(approveExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session!.user.role;
      const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
      const isHR = role === "hr_manager" || role === "super_admin";

      const existing = await ctx.db.query.expenses.findFirst({
        where: eq(schema.tenant.expenses.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Only the assigned approver, or HR, may act.
      if (!isHR && existing.approverEmployeeId !== userEmployeeId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the approver for this expense" });
      }
      if (existing.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending expenses can be approved or rejected" });
      }

      if (input.action === "approve") {
        const [updated] = await ctx.db
          .update(schema.tenant.expenses)
          .set({ status: "approved", approvedAt: new Date(), rejectionReason: null })
          .where(eq(schema.tenant.expenses.id, input.id))
          .returning();
        return updated;
      }

      if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A rejection reason is required" });
      }
      const [updated] = await ctx.db
        .update(schema.tenant.expenses)
        .set({ status: "rejected", rejectionReason: input.rejectionReason })
        .where(eq(schema.tenant.expenses.id, input.id))
        .returning();
      return updated;
    }),

  /**
   * Finance close-out: mark an approved expense as paid.
   * Only HR / super_admin can do this.
   */
  markPaid: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.expenses.findFirst({
        where: eq(schema.tenant.expenses.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only approved expenses can be marked paid" });
      }
      const [updated] = await ctx.db
        .update(schema.tenant.expenses)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(schema.tenant.expenses.id, input.id))
        .returning();
      return updated;
    }),

  /**
   * Lightweight counters for the dashboard cards. Returns:
   *   { mine, pendingMine, pendingForApproval, approvedThisMonth, totalThisMonth }
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const userEmployeeId = ctx.session!.user.employeeId as string | undefined;
    const role = ctx.session!.user.role;

    if (!userEmployeeId) {
      return { mine: 0, pendingMine: 0, pendingForApproval: 0, approvedThisMonth: 0, totalThisMonth: 0 };
    }

    // Plain Drizzle query (more portable than raw SQL):
    const myExpenses = await ctx.db.query.expenses.findMany({
      where: eq(schema.tenant.expenses.employeeId, userEmployeeId),
    });
    type Expense = (typeof myExpenses)[number];
    const mine = myExpenses.length;
    const pendingMine = myExpenses.filter((e: Expense) => e.status === "pending").length;

    let pendingForApproval = 0;
    if (role === "department_manager" || role === "hr_manager" || role === "super_admin") {
      const approverExpenses = await ctx.db.query.expenses.findMany({
        where: and(
          eq(schema.tenant.expenses.approverEmployeeId, userEmployeeId),
          eq(schema.tenant.expenses.status, "pending"),
        ),
      });
      pendingForApproval = approverExpenses.length;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const approvedThisMonth = myExpenses.filter(
      (e: Expense) => e.status === "approved" && e.approvedAt && e.approvedAt >= monthStart,
    ).length;
    const totalThisMonth = myExpenses.filter(
      (e: Expense) => e.expenseDate && e.expenseDate >= monthStart.toISOString().slice(0, 10),
    ).length;

    return { mine, pendingMine, pendingForApproval, approvedThisMonth, totalThisMonth };
  }),
});