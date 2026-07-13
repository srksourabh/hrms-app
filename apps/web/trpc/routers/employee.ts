import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } from "@hrms-app/validators";
import { and, eq, like, desc } from "drizzle-orm";

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

  create: requireRole("super_admin", "hr_manager")
    .input(createEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const [employee] = await ctx.db.insert(schema.tenant.employees).values(input).returning();
      return employee;
    }),

  update: requireRole("super_admin", "hr_manager")
    .input(z.object({ id: z.string().uuid(), data: updateEmployeeSchema }))
    .mutation(async ({ ctx, input }) => {
      const [employee] = await ctx.db
        .update(schema.tenant.employees)
        .set(input.data)
        .where(eq(schema.tenant.employees.id, input.id))
        .returning();
      return employee;
    }),

  delete: requireRole("super_admin")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.tenant.employees).where(eq(schema.tenant.employees.id, input));
      return { success: true };
    }),
});
