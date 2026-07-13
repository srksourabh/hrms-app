import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createFinalSettlementSchema } from "@hrms-app/validators";
import { eq, desc } from "drizzle-orm";

export const settlementRouter = createTRPCRouter({
  list: companyProcedure
    .input(
      z
        .object({
          employeeId: z.string().uuid().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const where = input?.employeeId ? eq(schema.tenant.finalSettlements.employeeId, input.employeeId) : undefined;
      return await ctx.db.query.finalSettlements.findMany({
        where,
        with: { employee: true },
        orderBy: desc(schema.tenant.finalSettlements.createdAt),
      });
    }),

  create: requireRole("super_admin", "hr_manager")
    .input(createFinalSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const [settlement] = await ctx.db.insert(schema.tenant.finalSettlements).values(input).returning();
      return settlement;
    }),

  getByEmployee: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.finalSettlements.findFirst({
      where: eq(schema.tenant.finalSettlements.employeeId, input),
      with: { employee: true },
    });
  }),
});
