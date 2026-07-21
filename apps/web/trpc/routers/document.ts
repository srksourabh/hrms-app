import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole, requireCapability } from "../server";
import { schema } from "@hrms-app/db";
import { createDocumentSchema, updateDocumentSchema, documentQuerySchema } from "@hrms-app/validators";
import { and, eq, desc, lte, isNotNull } from "drizzle-orm";
import { checkDocumentExpiry, EXPIRY_THRESHOLDS, generateSalaryCertificate, generateExperienceLetter } from "@hrms-app/documents";
import type { ExpiryThreshold } from "@hrms-app/documents";
import { TRPCError } from "@trpc/server";
import { tenants } from "@hrms-app/db";
import { writeAudit } from "../audit";

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
  /**
   * Generate a bilingual HR letter (DOC-001/002) as self-contained HTML that
   * the client can view / print / save-as-PDF. Data is merged from the
   * employee record; the Arabic version is marked as prevailing.
   */
  generateLetter: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(z.object({ employeeId: z.string().uuid(), type: z.enum(["salary_certificate", "experience_letter"]) }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input.employeeId),
        with: { department: true },
      });
      if (!employee) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });

      const tenant = await ctx.adminDb.query.tenants.findFirst({
        where: eq(tenants.id, ctx.user.tenantId),
      });
      const company = {
        nameEn: tenant?.companyName ?? "Company",
        nameAr: tenant?.companyName ?? "الشركة",
        crNumber: tenant?.crNumber,
      };
      const e = {
        fullName: employee.fullName,
        nationalId: employee.iqamaNumberEnc,
        position: employee.occupationCode,
        department: (employee.department as { name?: string } | null)?.name ?? null,
        joinDate: employee.hireDate,
        basicSalary: Number(employee.salaryBasic),
        housingAllowance: Number(employee.salaryHousing),
        transportAllowance: Number(employee.salaryTransport),
      };
      const html =
        input.type === "salary_certificate"
          ? generateSalaryCertificate(company, e)
          : generateExperienceLetter(company, e, employee.terminationDate ?? new Date().toISOString().slice(0, 10));

      // PRIV-010: this letter embeds the decrypted national ID and full salary,
      // so record who generated it for which employee (PII access trail).
      await writeAudit(ctx, {
        action: "document.generateLetter",
        entityType: "employee",
        entityId: input.employeeId,
        newValue: { letterType: input.type },
      });

      return { html, type: input.type };
    }),

  list: requireCapability("documents:view_company")
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

  getById: requireCapability("documents:view_company").input(z.string().uuid()).query(async ({ ctx, input }) => {
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
      where: (users, { eq }) => eq(users.id, ctx.user.id as string),
    });
    if (!user?.employeeId) return [];
    return await ctx.db.query.documents.findMany({
      where: eq(schema.tenant.documents.employeeId, user.employeeId),
      with: { employee: true },
      orderBy: desc(schema.tenant.documents.createdAt),
      limit: 100,
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
