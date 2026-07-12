import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createDocumentSchema, updateDocumentSchema, documentQuerySchema } from "@hrms-app/validators";
import { and, eq, desc, lte, isNotNull } from "drizzle-orm";
import { checkDocumentExpiry, EXPIRY_THRESHOLDS } from "@hrms-app/documents";
import type { ExpiryThreshold } from "@hrms-app/documents";

function toDocumentContext(row: typeof schema.tenant.documents.$inferSelect & { employee: { fullName: string } }) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee?.fullName ?? "Unknown",
    type: row.type,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    expiryDate: row.expiryDate,
    version: row.version,
  };
}

function toThreshold(days: number): ExpiryThreshold {
  const existing = EXPIRY_THRESHOLDS.find((t) => t.days === days);
  if (existing) return existing;
  return {
    days,
    label: `${days} days`,
    severity: days <= 30 ? "critical" : days <= 60 ? "warning" : "info",
  };
}

export const documentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(documentQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.employeeId) conditions.push(eq(schema.tenant.documents.employeeId, input.employeeId));
      if (input?.type) conditions.push(eq(schema.tenant.documents.type, input.type));
      if (input?.expiryBefore) {
        conditions.push(lte(schema.tenant.documents.expiryDate, input.expiryBefore));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.documents.findMany({
        where,
        with: { employee: true },
        orderBy: desc(schema.tenant.documents.createdAt),
        limit: input?.pageSize ?? 20,
        offset: input?.page ? (input.page - 1) * (input.pageSize ?? 20) : 0,
      });
    }),

  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.documents.findFirst({
      where: eq(schema.tenant.documents.id, input),
      with: { employee: true },
    });
  }),

  create: requireRole("super_admin", "hr_manager")
    .input(createDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const [document] = await ctx.db.insert(schema.tenant.documents).values(input).returning();
      return document;
    }),

  update: requireRole("super_admin", "hr_manager")
    .input(z.object({ id: z.string().uuid(), data: updateDocumentSchema }))
    .mutation(async ({ ctx, input }) => {
      const [document] = await ctx.db
        .update(schema.tenant.documents)
        .set(input.data)
        .where(eq(schema.tenant.documents.id, input.id))
        .returning();
      return document;
    }),

  delete: requireRole("super_admin")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.tenant.documents).where(eq(schema.tenant.documents.id, input));
      return { success: true };
    }),

  myDocuments: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.adminDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.user.id!),
    });
    if (!user?.employeeId) return [];
    return await ctx.db.query.documents.findMany({
      where: eq(schema.tenant.documents.employeeId, user.employeeId),
      with: { employee: true },
      orderBy: desc(schema.tenant.documents.createdAt),
    });
  }),

  checkExpiry: requireRole("super_admin", "hr_manager")
    .input(
      z
        .object({
          checkDate: z.string().optional(),
          thresholds: z.array(z.number().int().positive()).default([90, 60, 30]),
        })
        .optional()
        .default({})
    )
    .mutation(async ({ ctx, input }) => {
      const checkDate = input.checkDate ?? new Date().toISOString().split("T")[0];
      const thresholds = input.thresholds.map(toThreshold);

      const documents = await ctx.db.query.documents.findMany({
        where: and(isNotNull(schema.tenant.documents.expiryDate)),
        with: { employee: true },
      });

      const result = checkDocumentExpiry(
        documents.map(toDocumentContext),
        { thresholds, includeExpired: true }
      );

      return {
        checkDate,
        thresholds: input.thresholds,
        alerts: result.alerts,
        checkedCount: result.checkedCount,
        expiredCount: result.expiredCount,
      };
    }),
});
