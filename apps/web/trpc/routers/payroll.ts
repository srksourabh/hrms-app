import { z } from "zod";
import { createTRPCRouter, companyProcedure, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { TRPCError } from "@trpc/server";
import {
  createPayrollRunSchema,
  updatePayrollRunSchema,
  createPayslipSchema,
  payrollQuerySchema,
} from "@hrms-app/validators";
import { orchestratePayrollRun, generateMudadFile, mudadToXml, mudadToCsv } from "@hrms-app/payroll";
import { and, eq, desc } from "drizzle-orm";
import type { EmployeeContext, Nationality } from "@hrms-app/payroll";

function parseNumeric(value: string | null | undefined): number {
  return value ? Number.parseFloat(value) : 0;
}

function toEmployeeContext(row: typeof schema.tenant.employees.$inferSelect): EmployeeContext {
  return {
    id: row.id,
    fullName: row.fullName,
    nationality: row.nationality as Nationality,
    gosiSystem: row.gosiSystem,
    salaryBasic: parseNumeric(row.salaryBasic),
    salaryHousing: parseNumeric(row.salaryHousing),
    salaryTransport: parseNumeric(row.salaryTransport),
    hireDate: row.hireDate,
    employmentStatus: row.employmentStatus,
    bankIbanEnc: row.bankIbanEnc,
    gosiRegistrationDate: row.gosiRegistrationDate,
  };
}

export const payrollRouter = createTRPCRouter({
  run: createTRPCRouter({
    list: companyProcedure
      .input(payrollQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.periodMonth) conditions.push(eq(schema.tenant.payrollRuns.periodMonth, input.periodMonth));
        if (input?.status) conditions.push(eq(schema.tenant.payrollRuns.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.payrollRuns.findMany({
          where,
          with: { payslips: true, complianceChecks: true },
          orderBy: desc(schema.tenant.payrollRuns.createdAt),
          limit: input?.pageSize ?? 20,
          offset: input?.page ? (input.page - 1) * (input.pageSize ?? 20) : 0,
        });
      }),

    create: requireRole("super_admin", "hr_manager")
      .input(createPayrollRunSchema)
      .mutation(async ({ ctx, input }) => {
        const [run] = await ctx.db.insert(schema.tenant.payrollRuns).values(input).returning();

        const activeEmployees = await ctx.db.query.employees.findMany({
          where: eq(schema.tenant.employees.employmentStatus, "active"),
        });

        if (activeEmployees.length === 0) {
          return run;
        }

        const employeeContexts = activeEmployees.map(toEmployeeContext);
        const result = orchestratePayrollRun({
          payrollRunId: run.id,
          employees: employeeContexts,
        });

        const payslipValues = result.payslips.map((p: any) => ({
          payrollRunId: run.id,
          employeeId: p.employeeId,
          basic: p.basic.toString(),
          housing: p.housing.toString(),
          transport: p.transport.toString(),
          overtime: p.overtime.toString(),
          gross: (p._breakdown?.gross ?? p.basic + p.housing + p.transport + p.overtime).toString(),
          gosiEmployee: p.gosiEmployee.toString(),
          gosiEmployer: p.gosiEmployer.toString(),
          gosiPensionEmployee: (p._breakdown?.gosiPensionEmployee ?? 0).toString(),
          gosiPensionEmployer: (p._breakdown?.gosiPensionEmployer ?? 0).toString(),
          gosiOccHazardsEmployer: (p._breakdown?.gosiOccupationalHaz ?? 0).toString(),
          gosiSanedEmployer: (p._breakdown?.gosiSaned ?? 0).toString(),
          gosiContributoryBase: (p._breakdown?.contributoryBase ?? 0).toString(),
          gosiRateEmployee: (p._breakdown?.gosiRateEmployee ?? 0).toString(),
          gosiRateEmployer: (p._breakdown?.gosiRateEmployer ?? 0).toString(),
          gosiSystem: p._breakdown?.gosiSystem ?? null,
          deductions: p.deductions.toString(),
          eosbAccrued: (p._breakdown?.eosbAccrued ?? 0).toString(),
          eosbYearsOfService: (p._breakdown?.eosbYearsOfService ?? 0).toString(),
          netPay: p.netPay.toString(),
          breakdown: JSON.stringify(p._breakdown ?? {}),
        }));

        if (payslipValues.length > 0) {
          await ctx.db.insert(schema.tenant.payslips).values(payslipValues);
        }

        const complianceValues = result.checks.map((c: any) => ({
          payrollRunId: run.id,
          checkType: c.checkType,
          status: c.status,
          flaggedIssues: c.flaggedIssues,
        }));

        if (complianceValues.length > 0) {
          await ctx.db.insert(schema.tenant.complianceChecks).values(complianceValues);
        }

        const [updatedRun] = await ctx.db
          .update(schema.tenant.payrollRuns)
          .set({ totalAmount: result.totalAmount.toString(), status: "pre_check" })
          .where(eq(schema.tenant.payrollRuns.id, run.id))
          .returning();

        return updatedRun;
      }),

    updateStatus: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updatePayrollRunSchema }))
      .mutation(async ({ ctx, input }) => {
        const [run] = await ctx.db
          .update(schema.tenant.payrollRuns)
          .set(input.data)
          .where(eq(schema.tenant.payrollRuns.id, input.id))
          .returning();
        return run;
      }),

    getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
      return await ctx.db.query.payrollRuns.findFirst({
        where: eq(schema.tenant.payrollRuns.id, input),
        with: { payslips: { with: { employee: true } }, complianceChecks: true, wageFiles: true },
      });
    }),
  }),

  payslip: createTRPCRouter({
    list: companyProcedure
      .input(
        z
          .object({
            payrollRunId: z.string().uuid().optional(),
            employeeId: z.string().uuid().optional(),
          })
          .optional()
          .default({})
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.payrollRunId) conditions.push(eq(schema.tenant.payslips.payrollRunId, input.payrollRunId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.payslips.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.payslips.findMany({
          where,
          with: { employee: true, payrollRun: true },
          orderBy: desc(schema.tenant.payslips.createdAt),
        });
      }),

    /**
     * Self-service: returns the latest payslip for the current user. The
     * employee-role `list` procedure is gated behind companyProcedure, so
     * the /profile page needs this alternative for non-HR users.
     */
    myLatest: protectedProcedure.query(async ({ ctx }) => {
      const employeeId = ctx.user.employeeId;
      if (!employeeId) return null;
      return await ctx.db.query.payslips.findFirst({
        where: eq(schema.tenant.payslips.employeeId, employeeId),
        orderBy: desc(schema.tenant.payslips.createdAt),
        with: { payrollRun: true, employee: true },
      });
    }),

    getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
      return await ctx.db.query.payslips.findFirst({
        where: eq(schema.tenant.payslips.id, input),
        with: { employee: true, payrollRun: true },
      });
    }),

    create: requireRole("super_admin", "hr_manager")
      .input(z.array(createPayslipSchema))
      .mutation(async ({ ctx, input }) => {
        const payslips = await ctx.db.insert(schema.tenant.payslips).values(input).returning();
        return payslips;
      }),
  }),

  compliance: createTRPCRouter({
    list: companyProcedure
      .input(
        z
          .object({
            payrollRunId: z.string().uuid().optional(),
            status: z.enum(["passed", "flagged", "blocked"]).optional(),
          })
          .optional()
          .default({})
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.payrollRunId) conditions.push(eq(schema.tenant.complianceChecks.payrollRunId, input.payrollRunId));
        if (input?.status) conditions.push(eq(schema.tenant.complianceChecks.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.complianceChecks.findMany({
          where,
          orderBy: desc(schema.tenant.complianceChecks.createdAt),
        });
      }),
  }),

  wageFile: createTRPCRouter({
    generate: requireRole("super_admin", "hr_manager")
      .input(
        z.object({
          payrollRunId: z.string().uuid(),
          outputFormat: z.enum(["xml", "csv"]).default("xml"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const run = await ctx.db.query.payrollRuns.findFirst({
          where: eq(schema.tenant.payrollRuns.id, input.payrollRunId),
          with: { payslips: { with: { employee: true } } },
        });

        if (!run) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payroll run not found" });
        }

        if (!run.payslips || run.payslips.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No payslips in this payroll run" });
        }

        const employees: EmployeeContext[] = run.payslips
          .filter((p: any): p is typeof p & { employee: NonNullable<typeof p.employee> } => p.employee !== null)
          .map((p: any) => toEmployeeContext(p.employee));

        const payslipCalculations = run.payslips.map((p: any) => ({
          employeeId: p.employeeId,
          basic: parseNumeric(p.basic),
          housing: parseNumeric(p.housing),
          transport: parseNumeric(p.transport),
          overtime: parseNumeric(p.overtime),
          gosiEmployee: parseNumeric(p.gosiEmployee),
          gosiEmployer: parseNumeric(p.gosiEmployer),
          deductions: parseNumeric(p.deductions),
          netPay: parseNumeric(p.netPay),
        }));

        const mudadFile = generateMudadFile({
          periodMonth: run.periodMonth,
          payslips: payslipCalculations,
          employees,
        });

        const fileContent = input.outputFormat === "xml" ? mudadToXml(mudadFile) : mudadToCsv(mudadFile);

        const [wageFile] = await ctx.db
          .insert(schema.tenant.wageFiles)
          .values({
            payrollRunId: input.payrollRunId,
            format: `mudad_${input.outputFormat}`,
          })
          .returning();

        return { wageFile, content: fileContent };
      }),
  }),
});
