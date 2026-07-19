import { z } from "zod";
import { createTRPCRouter, companyProcedure, protectedProcedure, requireRole, PAYROLL_VIEW_ROLES } from "../server";
import { schema } from "@hrms-app/db";
import { TRPCError } from "@trpc/server";
import {
  createPayrollRunSchema,
  updatePayrollRunSchema,
  createPayslipSchema,
  payrollQuerySchema,
} from "@hrms-app/validators";
import { orchestratePayrollRun, generateMudadFile, mudadToXml, mudadToCsv } from "@hrms-app/payroll";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import type { EmployeeContext, Nationality } from "@hrms-app/payroll";
import { writeAudit } from "../audit";

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
    lastWorkingDay: row.terminationDate,
    employmentStatus: row.employmentStatus,
    bankIbanEnc: row.bankIbanEnc,
    gosiRegistrationDate: row.gosiRegistrationDate,
  };
}

export const payrollRouter = createTRPCRouter({
  run: createTRPCRouter({
    list: requireRole(...PAYROLL_VIEW_ROLES)
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
        // ── Period lock (PAY-010): never double-post a month ──────────────
        // Block a second run for the same period unless the prior one was
        // cancelled. Prevents re-running payroll and paying twice.
        const existingRun = await ctx.db.query.payrollRuns.findFirst({
          where: eq(schema.tenant.payrollRuns.periodMonth, input.periodMonth),
        });
        if (existingRun && existingRun.status !== "cancelled") {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              `A payroll run for ${input.periodMonth} already exists (status: ${existingRun.status}). ` +
              `Cancel or reopen it instead of creating a duplicate.`,
          });
        }

        const [run] = await ctx.db.insert(schema.tenant.payrollRuns).values(input).returning();

        const activeEmployees = await ctx.db.query.employees.findMany({
          where: eq(schema.tenant.employees.employmentStatus, "active"),
        });

        if (activeEmployees.length === 0) {
          return run;
        }

        const employeeContexts = activeEmployees.map(toEmployeeContext);

        // ── Attendance → payroll bridge (D6 / ATT-002/ATT-003) ─────────────
        // Aggregate the period's attendance into overtime pay and absence
        // deductions per employee, then feed them to the engine.
        const [yy, mm] = input.periodMonth.split("-").map(Number);
        const periodStart = `${input.periodMonth}-01`;
        const lastDay = new Date(Date.UTC(yy ?? 1970, mm ?? 1, 0)).getUTCDate();
        const periodEnd = `${input.periodMonth}-${String(lastDay).padStart(2, "0")}`;

        const attendance = await ctx.db.query.attendanceRecords.findMany({
          where: and(
            gte(schema.tenant.attendanceRecords.workDate, periodStart),
            lte(schema.tenant.attendanceRecords.workDate, periodEnd),
          ),
        });

        const overtime: Record<string, number> = {};
        const deductions: Record<string, number> = {};
        const otMinutes: Record<string, number> = {};
        const absentDays: Record<string, number> = {};
        for (const rec of attendance) {
          otMinutes[rec.employeeId] = (otMinutes[rec.employeeId] ?? 0) + (rec.overtimeMinutes ?? 0);
          if (rec.status === "absent") {
            absentDays[rec.employeeId] = (absentDays[rec.employeeId] ?? 0) + 1;
          }
        }
        for (const emp of employeeContexts) {
          const otMin = otMinutes[emp.id] ?? 0;
          if (otMin > 0) {
            // Ordinary overtime at 1.5× the basic hourly wage (basic / 208 hrs).
            overtime[emp.id] = Math.round(((emp.salaryBasic / 208) * 1.5 * (otMin / 60)) * 100) / 100;
          }
          const absent = absentDays[emp.id] ?? 0;
          if (absent > 0) {
            const dailyWage = (emp.salaryBasic + emp.salaryHousing + emp.salaryTransport) / 30;
            deductions[emp.id] = Math.round(dailyWage * absent * 100) / 100;
          }
        }

        const result = orchestratePayrollRun({
          payrollRunId: run.id,
          employees: employeeContexts,
          overtime,
          deductions,
          periodDate: periodStart,
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

        await writeAudit(ctx, {
          action: "payroll.run",
          entityType: "payroll_run",
          entityId: run.id,
          newValue: {
            periodMonth: input.periodMonth,
            employeeCount: result.payslips.length,
            totalAmount: result.totalAmount,
          },
        });

        return updatedRun;
      }),

    updateStatus: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updatePayrollRunSchema }))
      .mutation(async ({ ctx, input }) => {
        // ── Reopen guard (PAY-011): a completed period is locked ──────────
        // The generic status change must not silently reopen a completed
        // run; that requires the audited `reopen` workflow below.
        const current = await ctx.db.query.payrollRuns.findFirst({
          where: eq(schema.tenant.payrollRuns.id, input.id),
        });
        if (!current) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payroll run not found." });
        }
        if (
          current.status === "completed" &&
          input.data.status !== "completed" &&
          input.data.status !== "cancelled"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "A completed payroll period is locked. Use the reopen workflow (with a reason) to change it.",
          });
        }

        const [run] = await ctx.db
          .update(schema.tenant.payrollRuns)
          .set(input.data)
          .where(eq(schema.tenant.payrollRuns.id, input.id))
          .returning();
        return run;
      }),

    // Audited reopen of a completed period. A reason is mandatory; the change
    // is intended to be recorded in the audit log once B3 (audit helper) lands.
    reopen: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), reason: z.string().trim().min(10, "A reason (min 10 chars) is required to reopen a period.") }))
      .mutation(async ({ ctx, input }) => {
        const current = await ctx.db.query.payrollRuns.findFirst({
          where: eq(schema.tenant.payrollRuns.id, input.id),
        });
        if (!current) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payroll run not found." });
        }
        if (current.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only a completed period can be reopened." });
        }
        const [run] = await ctx.db
          .update(schema.tenant.payrollRuns)
          .set({ status: "draft" })
          .where(eq(schema.tenant.payrollRuns.id, input.id))
          .returning();
        await writeAudit(ctx, {
          action: "payroll.reopen",
          entityType: "payroll_run",
          entityId: input.id,
          oldValue: { status: current.status, periodMonth: current.periodMonth },
          newValue: { status: "draft", reason: input.reason },
        });
        return run;
      }),

    getById: requireRole(...PAYROLL_VIEW_ROLES).input(z.string().uuid()).query(async ({ ctx, input }) => {
      return await ctx.db.query.payrollRuns.findFirst({
        where: eq(schema.tenant.payrollRuns.id, input),
        with: { payslips: { with: { employee: true } }, complianceChecks: true, wageFiles: true },
      });
    }),
  }),

  payslip: createTRPCRouter({
    list: requireRole(...PAYROLL_VIEW_ROLES)
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
          limit: 200,
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

    getById: requireRole(...PAYROLL_VIEW_ROLES).input(z.string().uuid()).query(async ({ ctx, input }) => {
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
    list: requireRole(...PAYROLL_VIEW_ROLES)
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
