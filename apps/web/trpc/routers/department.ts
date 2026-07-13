import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createDepartmentSchema, updateDepartmentSchema } from "@hrms-app/validators";
import { eq } from "drizzle-orm";

export const departmentRouter = createTRPCRouter({
  list: companyProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.departments.findMany({
      with: { head: true, children: true },
      orderBy: (departments: any, { asc }: any) => asc(departments.name),
    });
  }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.departments.findFirst({
      where: eq(schema.tenant.departments.id, input),
      with: { head: true, children: { with: { head: true } }, parent: true, employees: true },
    });
  }),

  create: requireRole("super_admin", "hr_manager")
    .input(createDepartmentSchema)
    .mutation(async ({ ctx, input }) => {
      const [dept] = await ctx.db.insert(schema.tenant.departments).values(input).returning();
      return dept;
    }),

  update: requireRole("super_admin", "hr_manager")
    .input(z.object({ id: z.string().uuid(), data: updateDepartmentSchema }))
    .mutation(async ({ ctx, input }) => {
      const [dept] = await ctx.db
        .update(schema.tenant.departments)
        .set(input.data)
        .where(eq(schema.tenant.departments.id, input.id))
        .returning();
      return dept;
    }),

  delete: requireRole("super_admin")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const activeEmployees = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.departmentId, input),
      });
      if (activeEmployees) {
        throw new Error("Cannot delete department with active employees");
      }
      await ctx.db.delete(schema.tenant.departments).where(eq(schema.tenant.departments.id, input));
      return { success: true };
    }),

  tree: companyProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.query.departments.findMany({ with: { head: true, employees: true } });
    const roots = all.filter((d: any) => !d.parentDepartmentId);
    const children = (parentId: string) =>
      all.filter((d: any) => d.parentDepartmentId === parentId).map((d: any) => ({
        ...d,
        children: children(d.id),
      }));
    return roots.map((d: any) => ({ ...d, children: children(d.id) }));
  }),
});
